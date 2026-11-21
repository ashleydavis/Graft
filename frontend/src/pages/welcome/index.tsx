//
// The welcome page: the page Graft starts on, shown while no repo is open, with Graft's mark, name
// and what it is, and a button that opens a local repo.
//

import { faCodeBranch, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Avatar, Button } from "@mui/material";
import { JSX } from "react";
import { openRepoActionName } from "../../lib/open-repo";

//
// Logs that the welcome page's Open repo button could not run the open-repo action, with what to
// look at, because the button has no other way to report it.
//
export function reportOpenRepoFailure(error: unknown): void {
    console.error(`Graft could not run the ${openRepoActionName} action from the welcome page's Open repo button: ${String(error)}. No repo was opened, so look at the backend's log for why the action failed.`);
}

//
// Shows Graft's mark, name and what it is, and a button that opens a local repo, so a user who has
// just started Graft sees which app they are in and how to start using it. The mark is the one the
// About page shows, so both pages show Graft the same way. The content sits in the middle of the
// main content area, because it is all the page holds. The button runs the open-repo action, the
// one the File menu's "Open repo" item runs, so both open a repo the same way: the action's
// handler, which the layout registers, shows the directory picker and opens the directory chosen on
// the repo explorer page.
//
export function WelcomePage(): JSX.Element {
    return (
        <main data-id="welcome-page" className="graft-page-in flex min-h-full flex-col items-center justify-center gap-[var(--space-6)] p-[var(--space-8)] text-center">
            <Avatar data-id="welcome-icon">
                <FontAwesomeIcon icon={faCodeBranch} />
            </Avatar>
            <div className="flex flex-col items-center gap-[var(--space-2)]">
                <h1 data-id="welcome-heading" className="text-[length:var(--text-2xl)] font-[var(--weight-bold)] text-[var(--color-text)]">
                    Graft
                </h1>
                <p data-id="welcome-description" className="max-w-md text-[var(--color-text-muted)]">
                    A desktop Git client. Open a local Git repo to start working with it.
                </p>
            </div>
            <Button
                data-id="welcome-open-repo-button"
                variant="contained"
                size="large"
                startIcon={<FontAwesomeIcon icon={faFolderOpen} />}
                onClick={() => {
                    window.ziggy.runAction(openRepoActionName).catch(reportOpenRepoFailure);
                }}
            >
                Open repo
            </Button>
        </main>
    );
}
