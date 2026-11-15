//
// The header of a pane that opens to the right on the commits page: the pane's title and a button
// that closes it, laid out as the Graft UI mockup's columns are.
//

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton } from "@mui/material";
import { JSX } from "react";

//
// What the pane header shows and what it reports.
//
export interface IPaneHeaderProps {
    // The pane's title, cut short with an ellipsis when it is wider than the pane.
    title: string;

    // The data-id of the title, so a smoke test can read it.
    titleDataId: string;

    // The data-id of the close button, so a smoke test can click it.
    closeDataId: string;

    // Called when the user clicks the close button.
    onClose(): void;
}

//
// Shows the title in bold on the left and a close button with an X icon on the right, above a
// divider, so every pane that can be closed looks and closes the same way.
//
export function PaneHeader({ title, titleDataId, closeDataId, onClose }: IPaneHeaderProps): JSX.Element {
    return (
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2 dark:border-gray-700">
            <span data-id={titleDataId} title={title} className="min-w-0 flex-1 truncate font-bold">
                {title}
            </span>
            <IconButton data-id={closeDataId} aria-label="Close" title="Close" size="small" onClick={onClose}>
                <FontAwesomeIcon icon={faXmark} fixedWidth={true} />
            </IconButton>
        </div>
    );
}
