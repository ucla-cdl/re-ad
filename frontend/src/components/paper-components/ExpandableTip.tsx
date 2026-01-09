import { useRef } from "react";
import {
  GhostHighlight,
  PdfSelection,
  usePdfHighlighterContext,
} from "react-pdf-highlighter-extended";
import "../../styles/ExpandableTip.css";

interface ExpandableTipProps {
  addHighlight: (highlight: GhostHighlight) => void;
}

const ExpandableTip = ({ addHighlight }: ExpandableTipProps) => {
  const selectionRef = useRef<PdfSelection | null>(null);

  const {
    getCurrentSelection,
    removeGhostHighlight,
    setTip
  } = usePdfHighlighterContext();

  return (
    <div className="Tip">
        <button
          className="Tip__compact"
          onClick={() => {
            selectionRef.current = getCurrentSelection();
            addHighlight(
              {
                content: selectionRef.current!.content,
                type: selectionRef.current!.type,
                position: selectionRef.current!.position,
              },
            );
            removeGhostHighlight();
            setTip(null);
          }}
        >
          Add highlight
        </button>
    </div>
  );
};

export default ExpandableTip;