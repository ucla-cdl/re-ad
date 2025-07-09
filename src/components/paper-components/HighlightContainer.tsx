import {
    AreaHighlight,
    TextHighlight,
    useHighlightContainerContext,
} from "react-pdf-highlighter-extended";
import { ReadHighlight } from "../../contexts/StorageContext";

interface HighlightContainerProps {
    readPurposes: any;
    displayedReads: Array<string>;
    selectedHighlightIds: Array<string>;
    setSelectedHighlightIds: (ids: Array<string>) => void;
}

function HighlightContainer({
    readPurposes,
    displayedReads,
    selectedHighlightIds,
    setSelectedHighlightIds,
}: HighlightContainerProps) {
    const {
        highlight,
        isScrolledTo,
        highlightBindings,
    } = useHighlightContainerContext<ReadHighlight>();

    const color = displayedReads.includes(highlight.readPurposeId) ? readPurposes[highlight.readPurposeId].color : "#e6e6e6";
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