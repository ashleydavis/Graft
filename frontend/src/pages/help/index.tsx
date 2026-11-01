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
        <main data-id="help-page" className="flex flex-col items-start gap-4 p-6">
            <h1 data-id="help-heading" className="text-2xl font-bold">
                Help
            </h1>
            <p data-id="help-description">
                The left sidebar and the breadcrumb trail in the top bar move between Graft's pages. Commits lists the repo's commits and About says what Graft is.
            </p>
        </main>
    );
}
