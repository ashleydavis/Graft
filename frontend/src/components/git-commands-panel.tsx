//
// The Git commands panel: the help panel in the right sidebar that shows the Git commands the open
// page has run.
//

import { JSX } from "react";
import { IPageGitCommands } from "../lib/git-commands";
import { CopyButton } from "./copy-button";

//
// The commands the panel shows.
//
export interface IGitCommandsPanelProps {
    // The commands the open page has run, or undefined when it has run none.
    pageCommands: IPageGitCommands | undefined;
}

//
// Shows the `cd` into the repo above the page's Git commands, the most recent first and marked as
// such, each with a button that copies it, so a user can run what Graft ran in a terminal. For a
// page that has run no commands it shows the line "This page has run no Git commands."
//
export function GitCommandsPanel({ pageCommands }: IGitCommandsPanelProps): JSX.Element {
    return (
        <section data-id="git-commands-panel" className="flex flex-col gap-2 p-4">
            <h2 data-id="git-commands-heading" className="text-lg font-bold">
                Git commands
            </h2>
            {pageCommands === undefined && (
                <p data-id="git-commands-empty">
                    This page has run no Git commands.
                </p>
            )}
            {pageCommands !== undefined && (
                <>
                    <div className="flex items-center gap-1">
                        <code data-id="git-commands-directory" className="min-w-0 flex-1 break-all text-sm">
                            {pageCommands.directoryCommand}
                        </code>
                        <CopyButton dataId="git-commands-directory-copy" text={pageCommands.directoryCommand} />
                    </div>
                    <ol data-id="git-commands-list" className="flex flex-col gap-1">
                        {pageCommands.commands.map((command, index) => (
                            <li key={command} data-id={`git-command-${index}`} className="flex flex-col">
                                {index === 0 && (
                                    <span data-id="git-command-most-recent" className="text-xs text-gray-500 dark:text-gray-400">
                                        Most recent
                                    </span>
                                )}
                                <div className="flex items-center gap-1">
                                    <code data-id={`git-command-${index}-text`} className="min-w-0 flex-1 break-all text-sm">
                                        {command}
                                    </code>
                                    <CopyButton dataId={`git-command-${index}-copy`} text={command} />
                                </div>
                            </li>
                        ))}
                    </ol>
                </>
            )}
        </section>
    );
}
