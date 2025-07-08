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
    normalizedPositionY: number;
}

interface HighlightContainerProps {
    readRecords: any;
    displayedReads: Array<string>;
    selectedHighlightIds: Array<string>;
    setSelectedHighlightIds: (ids: Array<string>) => void;
}

function HighlightContainer({
    readRecords,
    displayedReads,
    selectedHighlightIds,
    setSelectedHighlightIds,
}: HighlightContainerProps) {
    const {
        highlight,
        isScrolledTo,
        highlightBindings,
    } = useHighlightContainerContext<ReadHighlight>();

    const color = displayedReads.includes(highlight.readRecordId) ? readRecords[highlight.readRecordId].color : "#e6e6e6";
    const isSelected = selectedHighlightIds.includes(highlight.id);

    return (
        highlight.type === "text" ?
            <TextHighlight
                isScrolledTo={isScrolledTo}
                highlight={highlight}
                style={{
                    background: color,
                    border: isSelected ? `2px solid black` : "none",
                }}
                onClick={() => setSelectedHighlightIds([highlight.id])}
            />
            :
            <AreaHighlight
                isScrolledTo={isScrolledTo}
                highlight={highlight}
                bounds={highlightBindings.textLayer}
                style={{
                    background: color,
                    pointerEvents: "none",
                    border: isSelected ? `2px solid black` : "none",
                }}
            />
    );
};

export default HighlightContainer;