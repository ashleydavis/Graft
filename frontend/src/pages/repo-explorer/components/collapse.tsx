//
// Collapsing a pane of the repo explorer: the button in a pane's header that folds the pane into a
// narrow strip at its left, and the strip drawn in the pane's place until it is restored, as the
// style guide's collapse button and collapsed strip are drawn.
//

import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton, Tooltip } from "@mui/material";
import { JSX } from "react";
import { activePaneClass } from "./active-pane-style";
import { Tip } from "./tip";

//
// What the collapse button reports and how a smoke test finds it.
//
export interface ICollapseButtonProps {
    // The data-id of the button, so a smoke test can click it.
    dataId: string;

    // Called when the user clicks the button.
    onCollapse(): void;
}

//
// Shows the button with a chevron pointing left that folds the pane into a strip at its left, with
// a tooltip that shows what it does and names the key, C, as the style guide's collapse button
// does.
//
export function CollapseButton({ dataId, onCollapse }: ICollapseButtonProps): JSX.Element {
    return (
        <Tooltip title={<Tip title="Collapse the pane to the left" detail="Key: C" />}>
            <IconButton data-id={dataId} aria-label="Collapse the pane" size="small" onClick={onCollapse}>
                <FontAwesomeIcon icon={faChevronLeft} />
            </IconButton>
        </Tooltip>
    );
}

//
// What a collapsed pane's strip shows and what it reports.
//
export interface ICollapsedStripProps {
    // The pane's name, as in "Commits", the same as the pane's own name for assistive technology,
    // so the pane keeps its name while it is collapsed.
    paneLabel: string;

    // The pane's title, written down the strip.
    title: string;

    // The data-id of the pane, which the strip's own data-ids start with, so a smoke test can find
    // the strip, its title and its restore button.
    paneDataId: string;

    // Whether the pane is the repo explorer's active pane, which the strip's border shows.
    isActive: boolean;

    // Called when the user clicks the restore button.
    onRestore(): void;
}

//
// Shows the strip drawn in place of a collapsed pane: a rounded card the width of a button, as tall
// as the pane, with a button at its top that restores the pane and the pane's title written down
// it in muted bold text, cut short with an ellipsis when it is longer than the strip. The strip's
// border is in the style guide's active pane colour while the pane is active, as the pane's own is.
//
export function CollapsedStrip({ paneLabel, title, paneDataId, isActive, onRestore }: ICollapsedStripProps): JSX.Element {
    return (
        <section data-id={`${paneDataId}-strip`} aria-label={paneLabel} className={`flex flex-none flex-col items-center gap-[var(--space-2)] overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-panel)] p-[var(--space-1)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activePaneClass(isActive)}`}>
            <Tooltip title={<Tip title="Restore the pane" detail="Key: C" />}>
                <IconButton data-id={`${paneDataId}-restore`} aria-label={`Restore ${paneLabel.toLowerCase()}`} size="small" onClick={onRestore}>
                    <FontAwesomeIcon icon={faChevronRight} />
                </IconButton>
            </Tooltip>
            <span data-id={`${paneDataId}-strip-title`} className="min-h-0 truncate text-[length:var(--text-sm)] font-[var(--weight-bold)] text-[var(--color-text-muted)] [writing-mode:vertical-rl]">
                {title}
            </span>
        </section>
    );
}
