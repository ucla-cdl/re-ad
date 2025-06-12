import JSZip from 'jszip';

export async function exportGraph({ highlights, nodes, edges, readRecords, pdfUrl, userId = "unknown" }: {
  highlights: any[],
  nodes: any[],
  edges: any[],
  readRecords: any,
  pdfUrl: string | null,
  userId?: string
}) {
  const zip = new JSZip();
  
  // Add JSON data. Include `userId` to track who made the export.
  const data = { userId, highlights, nodes, edges, readRecords };
  zip.file("re-ad-graph-export.json", JSON.stringify(data, null, 2));

  // Add PDF if available
  if (pdfUrl) {
    try {
      // Fetch the PDF file
      const response = await fetch(pdfUrl);
      const pdfBlob = await response.blob();
      
      // Get the PDF filename from the URL or use a default name
      const pdfFilename = 'document.pdf';
      zip.file(pdfFilename, pdfBlob);
    } catch (error) {
      console.error('Error adding PDF to zip:', error);
    }
  }

  // Generate and download the zip file
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = "re-ad-export.zip";
  a.click();
  URL.revokeObjectURL(url);
}


export async function importGraphs(
  files: FileList | File[],
  setGraphState: (data: any) => void,
  setPdfUrl: (url: string) => void
) {
  // Combined containers
  let combinedHighlights: any[] = [];
  let combinedNodes: any[] = [];
  let combinedEdges: any[] = [];
  let combinedReadRecords: Record<string, any> = {};

  let pdfAlreadySet = false;

  // iterate through every provided file
  for (const file of Array.from(files)) {
    if (file.type !== "application/zip") continue;

    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      const jsonFile = Object.values(zipContent.files).find((f) => f.name.endsWith(".json"));
      const pdfFile = Object.values(zipContent.files).find((f) => f.name.endsWith(".pdf"));

      if (!jsonFile) {
        console.warn(`No JSON found in ${file.name}. Skipping`);
        continue;
      }

      // Parse JSON
      const jsonContent = await jsonFile.async("string");
      const { userId = "unknown", highlights = [], nodes = [], edges = [], readRecords = {} } = JSON.parse(jsonContent);

      //user-id-oldid naming to prevent id collsisions

      const readIdMap: Record<string, string> = {};
      Object.entries(readRecords).forEach(([oldId, record]: [string, any]) => {
        const newReadId = `${userId}-${oldId}`;
        // Save to combined map (later duplicates from same user overwrite identical)
        combinedReadRecords[newReadId] = { ...record, id: newReadId };
        readIdMap[oldId] = newReadId;
      });

      const highlightIdMap: Record<string, string> = {};

      highlights.forEach((h: any) => {
        const newHighlightId = `${userId}-${h.id}`;
        highlightIdMap[h.id] = newHighlightId;
        combinedHighlights.push({
          ...h,
          id: newHighlightId,
          readRecordId: readIdMap[h.readRecordId] ?? h.readRecordId,
          userId,
        });
      });

      // process nodes
      nodes.forEach((n: any) => {
        const newNodeId = highlightIdMap[n.id] ?? `${userId}-${n.id}`;
        const newNode = {
          ...n,
          id: newNodeId,
          data: {
            ...n.data,
            id: newNodeId,
            readRecordId: readIdMap[n.data?.readRecordId] ?? n.data?.readRecordId,
          },
        };
        combinedNodes.push(newNode);
      });

      // process edges with remapped ids
      edges.forEach((e: any) => {
        const newEdgeId = `${userId}-${e.id}`;
        combinedEdges.push({
          ...e,
          id: newEdgeId,
          source: highlightIdMap[e.source] ?? `${userId}-${e.source}`,
          target: highlightIdMap[e.target] ?? `${userId}-${e.target}`,
        });
      });

      if (pdfFile && !pdfAlreadySet) {
        const pdfBlob = await pdfFile.async("blob");
        const reader = new FileReader();
        reader.onload = (e) => {
          setPdfUrl(e.target?.result as string);
        };
        reader.readAsDataURL(pdfBlob);
        pdfAlreadySet = true;
      }
    } catch (err) {
      console.error("Error processing zip file", file.name, err);
      alert("Error processing zip file: " + file.name);
    }
  }

  setGraphState({
    highlights: combinedHighlights,
    nodes: combinedNodes,
    edges: combinedEdges,
    readRecords: combinedReadRecords,
  });
}

// if only one file is provided, use this function
export async function importGraph(file: File, setGraphState: (data: any) => void, setPdfUrl: (url: string) => void) {
  await importGraphs([file], setGraphState, setPdfUrl);
} 