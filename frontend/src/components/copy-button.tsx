//
// The copy button: a small button that copies a piece of text to the clipboard.
//

import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton } from "@mui/material";
import { JSX } from "react";

//
// What the copy button copies and how a smoke test finds it.
//
export interface ICopyButtonProps {
    // The data-id of the button.
    dataId: string;

    // The text the button copies.
    text: string;
}

//
// Copies the text to the clipboard when clicked. A copy the web view refuses is reported in the
// log with what to look at, because the button has nowhere else to show it.
//
export function CopyButton({ dataId, text }: ICopyButtonProps): JSX.Element {
    return (
        <IconButton data-id={dataId} size="small" aria-label="Copy" title="Copy" onClick={() => copyText(text)}>
            <FontAwesomeIcon icon={faCopy} />
        </IconButton>
    );
}

//
// Writes the text to the clipboard and reports a failure in the log.
//
export function copyText(text: string): void {
    navigator.clipboard.writeText(text).catch(error => {
        console.error(`Graft could not copy "${text}" to the clipboard: ${String(error)}. Nothing was copied, so look at whether the web view allows the clipboard.`);
    });
}
