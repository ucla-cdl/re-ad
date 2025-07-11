import {
    AreaHighlight,
    TextHighlight,
    useHighlightContainerContext,
} from "react-pdf-highlighter-extended";
import { ReadHighlight } from "../../contexts/StorageContext";
import { MODE_TYPES } from "../../contexts/WorkspaceContext";
import { AnalyticsLevel } from "../../contexts/AnalysisContext";

interface HighlightContainerProps {
    mode: string;
    analyticsLevel: string;
    readPurposes: any;
    displayedReads: Array<string>;
    selectedHighlightIds: Array<string>;
    setSelectedHighlightIds: (ids: Array<string>) => void;
}

function HighlightContainer({
    mode,
    analyticsLevel,
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

    const getColor = () => {
        let color = "#dceefa";

        if (mode === MODE_TYPES.ANALYZING) {
            if (analyticsLevel === AnalyticsLevel.PURPOSES) {
                color = readPurposes[highlight.readPurposeId].color;
            }
        }
        else if (mode === MODE_TYPES.READING) {
            color = displayedReads.includes(highlight.readPurposeId) ? readPurposes[highlight.readPurposeId].color : "#e6e6e6";
        }

        return color;
    }
    
    const isSelected = selectedHighlightIds.includes(highlight.id);

    return (
        highlight.type === "text" ?
            <TextHighlight
                isScrolledTo={isScrolledTo}
                highlight={highlight}
                style={{
                    background: getColor(),
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
                    background: getColor(),
                    pointerEvents: "none",
                    border: isSelected ? `2px solid black` : "none",
                }}
            />
    );
};

export default HighlightContainer;