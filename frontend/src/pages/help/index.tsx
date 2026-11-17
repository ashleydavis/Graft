//
// The Help page: a short guide to finding your way around Graft.
//

import { JSX } from "react";

//
// Shows a heading and how to move between Graft's pages, so a user who opens Help learns where
// things are.
//
export function HelpPage(): JSX.Element {
    return (
        <main data-id="help-page" className="graft-page-in flex max-w-3xl flex-col items-start gap-4 p-6">
            <h1 data-id="help-heading" className="text-[length:var(--text-2xl)] font-[var(--weight-bold)] text-[var(--color-text)]">
                Help
            </h1>
            <p data-id="help-description">
                The left sidebar and the breadcrumb trail in the top bar move between Graft's pages. File, then Open repo, opens a repo, and Commits lists its commits. About says what Graft is.
            </p>
        </main>
    );
}
