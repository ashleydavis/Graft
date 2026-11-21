//
// One entry of a Help page section: the page or control it is about and the text about it.
//

import { JSX, ReactNode } from "react";

//
// What one entry of a Help page section names, the text it shows about it and its data-id.
//
export interface IHelpEntryProps {
    // The page or control the entry is about, such as "Left sidebar".
    term: string;

    // The data-id of the entry. Its term's data-id adds "-term" to it and its text's adds
    // "-text", so a smoke test can read each.
    dataId: string;

    // The text the entry shows about the term.
    children: ReactNode;
}

//
// Shows one entry of a section: the term in the text colour and medium weight, so the eye finds
// it when scanning, and under it what the term does in the muted text colour, as the style guide
// sets a label above its value.
//
export function HelpEntry({ term, dataId, children }: IHelpEntryProps): JSX.Element {
    return (
        <div data-id={dataId} className="flex flex-col gap-[var(--space-1)]">
            <dt data-id={`${dataId}-term`} className="font-[var(--weight-medium)] text-[var(--color-text)]">
                {term}
            </dt>
            <dd data-id={`${dataId}-text`} className="text-[var(--color-text-muted)]">
                {children}
            </dd>
        </div>
    );
}
