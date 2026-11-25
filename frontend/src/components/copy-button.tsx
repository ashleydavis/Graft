//
// The copy button: a small icon button that copies a piece of text to the clipboard and shows a
// tick for a moment once it has.
//

import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton } from "@mui/material";
import { JSX, useEffect, useState } from "react";
import { COPIED_DURATION_MS, copyText } from "../lib/clipboard";
import { LabelTooltip } from "./tooltip";

//
// What the copy button copies, what it is called and how a smoke test finds it.
//
export interface ICopyButtonProps {
    // The data-id of the button.
    dataId: string;

    // The text the button copies.
    text: string;

    // The button's name and tooltip, which say what it copies, such as "Copy command".
    label: string;
}

//
// Copies the text to the clipboard when clicked. Once the copy has worked, the copy icon turns
// into a tick in the success colour and the button's name and tooltip say "Copied" for
// COPIED_DURATION_MS, so the user sees the copy happened. A copy the web view refuses is reported
// in the log with what to look at, because the button has nowhere else to show it.
//
export function CopyButton({ dataId, text, label }: ICopyButtonProps): JSX.Element {
    const [isCopied, setCopied] = useState(false);

    useEffect(() => {
        if (!isCopied) {
            return undefined;
        }
        const timer = setTimeout(() => setCopied(false), COPIED_DURATION_MS);
        return () => clearTimeout(timer);
    }, [isCopied]);

    let name = label;
    if (isCopied) {
        name = "Copied";
    }

    return (
        <LabelTooltip label={name} placement="bottom">
            <IconButton
                data-id={dataId}
                size="small"
                aria-label={name}
                onClick={() => copyText(text, () => setCopied(true))}
                className={isCopied ? "text-[var(--color-success)] hover:text-[var(--color-success)]" : ""}
            >
                <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} />
            </IconButton>
        </LabelTooltip>
    );
}
