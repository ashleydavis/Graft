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
        <section data-id="git-commands-panel" className="flex flex-col gap-3 p-4">
            <h2 data-id="git-commands-heading" className="text-[length:var(--text-lg)] font-[var(--weight-bold)] text-[var(--color-text)]">
                Git commands
            </h2>
            {pageCommands === undefined && (
                <p data-id="git-commands-empty" className="text-[length:var(--text-md)] text-[var(--color-text-muted)]">
                    This page has run no Git commands.
                </p>
            )}
            {pageCommands !== undefined && (
                <>
                    <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-raised)] py-1 pl-3 pr-1">
                        <code data-id="git-commands-directory" className="min-w-0 flex-1 break-all text-[length:var(--text-sm)]">
                            {pageCommands.directoryCommand}
                        </code>
                        <CopyButton dataId="git-commands-directory-copy" text={pageCommands.directoryCommand} />
                    </div>
                    <ol data-id="git-commands-list" className="flex flex-col gap-2">
                        {pageCommands.commands.map((command, index) => (
                            <li key={command} data-id={`git-command-${index}`} className="flex flex-col">
                                {index === 0 && (
                                    <span data-id="git-command-most-recent" className="pb-1 text-[length:var(--text-xs)] font-[var(--weight-medium)] text-[var(--color-text-muted)]">
                                        Most recent
                                    </span>
                                )}
                                <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-raised)] py-1 pl-3 pr-1 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:border-[var(--color-border-control)]">
                                    <code data-id={`git-command-${index}-text`} className="min-w-0 flex-1 break-all text-[length:var(--text-sm)]">
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
