export interface ReadTemplate {
  name: string;
  reads: Array<{
    title: string;
    color: string;
  }>;
}

export const READ_TEMPLATES: ReadTemplate[] = [
  {
    name: "Research Paper",
    reads: [
      { title: "Skim", color: "#FFADAD" },
      { title: "Methodology", color: "#FFD6A5" },
      { title: "Experiments", color: "#CAFFBF" },
      { title: "Discussion and findings", color: "#9BF6FF" }
    ]
  },
  {
    name: "Three pass method",
    reads: [
      { title: "First Pass", color: "#A0C4FF" },
      { title: "Second Pass", color: "#BDB2FF" },
      { title: "Third Pass", color: "#FFC6FF" }
    ]
  }
]; 