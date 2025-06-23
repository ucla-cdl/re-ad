import {
    AreaHighlight,
    TextHighlight,
    useHighlightContainerContext,
} from "react-pdf-highlighter-extended";
import { Content, Highlight } from "react-pdf-highlighter-extended";

export interface ReadHighlight extends Highlight {
    id: string;
    readRecordId: string;
    sessionId: string;
    content: Content;
    timestamp: number;
}

interface HighlightContainerProps {
    readRecords: any;
    displayedReads: Array<string>;
    setSelectedHighlightId: (id: string | null) => void;
}

function HighlightContainer({
    readRecords,
    displayedReads,
    setSelectedHighlightId,
}: HighlightContainerProps) {
    const {
        highlight,
        isScrolledTo,
        highlightBindings,
    } = useHighlightContainerContext<ReadHighlight>();

    // Transparent Colors: #f2f2f2, #e6e6e6, #d9d9d9
    const color = displayedReads.includes(highlight.readRecordId) ? readRecords[highlight.readRecordId].color : "#e6e6e6";

    return (
        highlight.type === "text" ?
            <TextHighlight
                isScrolledTo={isScrolledTo}
                highlight={highlight}
                style={{
                    background: color,
                }}
                onClick={() => setSelectedHighlightId(highlight.id)}
            />
            :
            <AreaHighlight
                isScrolledTo={isScrolledTo}
                highlight={highlight}
                bounds={highlightBindings.textLayer}
                style={{
                    background: color,
                    pointerEvents: "none",
                }}
            />
    );
};

export default HighlightContainer;