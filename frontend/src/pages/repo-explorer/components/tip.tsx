//
// The content of a tooltip with a title and a detail, as the style guide's tooltips with a title
// and a detail are laid out, for the repo explorer's buttons whose tooltips say what they do and
// then more about it.
//

import { JSX } from "react";

//
// What a tooltip with a title and a detail shows.
//
export interface ITipProps {
    // What the button does, in bold.
    title: string;

    // More about it, such as what that means for the file or which key does the same, under it.
    detail: string;
}

//
// Shows the tooltip's title in bold, then its detail under it in smaller text, for the stage
// button, the Commit button, the collapse button and a collapsed pane's restore button.
//
export function Tip({ title, detail }: ITipProps): JSX.Element {
    return (
        <span className="flex flex-col gap-1">
            <span className="font-[var(--weight-bold)]">{title}</span>
            <span className="text-[length:var(--text-xs)] font-[var(--weight-normal)] opacity-80">{detail}</span>
        </span>
    );
}
