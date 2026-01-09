import JSZip from 'jszip';

export async function exportGraph({ highlights, nodes, edges, readRecords, pdfUrl }: {
  highlights: any[],
  nodes: any[],
  edges: any[],
  readRecords: any,
  pdfUrl: string | null
}) {
  const zip = new JSZip();
  
  // Add JSON data
  const data = { highlights, nodes, edges, readRecords };
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

export async function importGraph(file: File, setGraphState: (data: any) => void, setPdfUrl: (url: string) => void) {
  if (file.type === "application/zip") {
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      // Find the JSON file and PDF file in the zip
      const jsonFile = Object.values(zipContent.files).find(file => file.name.endsWith('.json'));
      const pdfFile = Object.values(zipContent.files).find(file => file.name.endsWith('.pdf'));
      
      if (!jsonFile) {
        throw new Error("No JSON file found in the zip");
      }

      // Read and parse the JSON data
      const jsonContent = await jsonFile.async('string');
      const data = JSON.parse(jsonContent);
      setGraphState(data);

      // If PDF exists, convert it to base64 and set it as the PDF URL
      if (pdfFile) {
        const pdfBlob = await pdfFile.async('blob');
        const reader = new FileReader();
        reader.onload = (e) => {
          setPdfUrl(e.target?.result as string);
        };
        reader.readAsDataURL(pdfBlob);
      }
    } catch (err) {
      alert("Error processing zip file: ");
    }
  } else {
    alert("Please upload a valid zip file");
  }
} 