//
// The header of a pane in the repo explorer: the pane's title, the button that maximises the pane
// and, for a pane that can be closed, a button that closes it, laid out as the style guide's
// commit explorer panes are.
//

import { faDownLeftAndUpRightToCenter, faUpRightAndDownLeftFromCenter, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton, Tooltip } from "@mui/material";
import { JSX, ReactNode } from "react";
import { MAXIMISE_KEY } from "../../../lib/repo-explorer";

//
// What the pane header shows.
//
export interface IPaneHeaderProps {
    // The pane's title, cut short with an ellipsis when it is wider than the pane.
    title: ReactNode;

    // The data-id of the title, so a smoke test can read it.
    titleDataId: string;

    // What shows at the right of the header, such as the maximise and close buttons, or undefined
    // for nothing.
    action: ReactNode | undefined;
}

//
// Shows the title in bold on the left and the action on the right, above a divider, on a header
// one spacing step taller than a control so every pane's header is the same height.
//
export function PaneHeader({ title, titleDataId, action }: IPaneHeaderProps): JSX.Element {
    return (
        <div className="flex min-h-[calc(var(--space-8)+var(--space-2))] flex-none items-center gap-2 border-b border-[var(--color-border)] py-1 pl-4 pr-2">
            <div data-id={titleDataId} className="min-w-0 flex-1 truncate font-[var(--weight-bold)] text-[var(--color-text)]">
                {title}
            </div>
            {action}
        </div>
    );
}

//
// What the close button closes and how a smoke test finds it.
//
export interface ICloseButtonProps {
    // The name of the pane the button closes, as in "Commit details", which names the button for
    // assistive technology.
    paneLabel: string;

    // The data-id of the button, so a smoke test can click it.
    dataId: string;

    // Called when the user clicks the button.
    onClose(): void;
}

//
// Shows the X icon button that closes a pane, with a "Close" tooltip, so every pane that can be
// closed closes the same way.
//
export function CloseButton({ paneLabel, dataId, onClose }: ICloseButtonProps): JSX.Element {
    return (
        <Tooltip title="Close">
            <IconButton data-id={dataId} aria-label={`Close ${paneLabel.toLowerCase()}`} size="small" onClick={onClose}>
                <FontAwesomeIcon icon={faXmark} />
            </IconButton>
        </Tooltip>
    );
}

//
// What the maximise button shows and does and how a smoke test finds it.
//
export interface IMaximiseButtonProps {
    // Whether the pane is maximised, so the button shows that a click restores the panes.
    isMaximised: boolean;

    // The data-id of the button, so a smoke test can click it.
    dataId: string;

    // Called when the user clicks the button.
    onToggleMaximise(): void;
}

//
// Shows the icon button that maximises a pane, as the style guide's maximise button does: arrows
// pointing out while the pane is at its usual size and arrows pointing in while it is maximised.
// Its tooltip shows what a click does in bold and names the key that does the same below it, so
// the user learns the key. aria-pressed gives assistive technology whether the pane is maximised.
//
export function MaximiseButton({ isMaximised, dataId, onToggleMaximise }: IMaximiseButtonProps): JSX.Element {
    let label = "Maximise the pane";
    let icon = faUpRightAndDownLeftFromCenter;
    if (isMaximised) {
        label = "Restore the pane";
        icon = faDownLeftAndUpRightToCenter;
    }
    const tip = (
        <span className="flex flex-col gap-[2px] py-[2px]">
            <span className="font-[var(--weight-bold)]">{label}</span>
            <span className="text-[length:var(--text-xs)] font-[var(--weight-normal)] opacity-80">{`Key: ${MAXIMISE_KEY}`}</span>
        </span>
    );
    return (
        <Tooltip title={tip}>
            <IconButton data-id={dataId} aria-label={label} aria-pressed={isMaximised} size="small" onClick={onToggleMaximise}>
                <FontAwesomeIcon icon={icon} />
            </IconButton>
        </Tooltip>
    );
}
