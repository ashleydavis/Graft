//
// The welcome page: the page Graft starts on, shown while no repo is open, with Graft's name and a
// button that opens a local repo.
//

import { faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@mui/material";
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
// Shows Graft's name and a button that opens a local repo, so a user who has just started Graft
// sees which app they are in and how to start using it. The button runs the open-repo action, the
// one the File menu's "Open repo" item runs, so both open a repo the same way: the action's
// handler, which the layout registers, shows the folder picker and opens the folder chosen on the
// commits page.
//
export function WelcomePage(): JSX.Element {
    return (
        <main data-id="welcome-page" className="flex flex-col items-center gap-6 p-12">
            <h1 data-id="welcome-heading" className="text-4xl font-bold">
                Graft
            </h1>
            <Button
                data-id="welcome-open-repo-button"
                variant="contained"
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
