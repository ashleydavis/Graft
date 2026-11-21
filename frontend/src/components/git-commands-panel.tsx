//
// The Git commands panel: the help panel in the right sidebar that shows the Git commands the open
// page has run.
//

import { faTerminal } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
// What one command block shows and how a smoke test finds its parts.
//
export interface ICommandBlockProps {
    // The command, as a user would type it in a terminal.
    command: string;

    // The data-id of the command's text. The copy button's data-id is given separately.
    textDataId: string;

    // The data-id of the button that copies the command.
    copyDataId: string;
}

//
// The length above which a word of a command, such as a full hash or a long path, may break
// anywhere to fit the panel. Shorter words, such as options like --no-commit-id, stay whole on one
// line, so a line never breaks inside an option at its hyphens. The style guide's panel uses the
// same length.
//
export const COMMAND_WORD_LENGTH_UNBROKEN_MAX = 24;

//
// Shows one command on the raised colour, as the style guide's panel does: a muted "$" prompt, the
// command in the code font, wrapping between words, and a copy button at its top right. The prompt
// is hidden from assistive technology and sits outside the command's text, so the text holds the
// command alone and the copy button copies it alone.
//
export function CommandBlock({ command, textDataId, copyDataId }: ICommandBlockProps): JSX.Element {
    return (
        <div className="flex items-start gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-raised)] py-[var(--space-1)] pl-[var(--space-3)] pr-[var(--space-1)]">
            <code className="flex min-w-0 flex-1 gap-[var(--space-2)] py-[var(--space-1)] font-[family-name:var(--font-mono)] text-[length:var(--text-sm)] leading-[var(--leading-normal)]">
                <span aria-hidden="true" className="flex-none select-none text-[var(--color-text-muted)]">
                    $
                </span>
                <span data-id={textDataId}>
                    {command.split(" ").map((word, index) => (
                        <span key={index}>
                            {index > 0 ? " " : ""}
                            <span className={word.length > COMMAND_WORD_LENGTH_UNBROKEN_MAX ? "[overflow-wrap:anywhere]" : "whitespace-nowrap"}>{word}</span>
                        </span>
                    ))}
                </span>
            </code>
            <CopyButton dataId={copyDataId} text={command} label="Copy command" />
        </div>
    );
}

//
// Shows a heading with a line on what the panel is for, then the `cd` into the repo above the
// page's Git commands, the most recent first and marked as such, each with a button that copies
// it, so a user can run what Graft ran in a terminal. For a page that has run no commands it shows
// the line "This page has run no Git commands." in a dashed box with a terminal icon.
//
export function GitCommandsPanel({ pageCommands }: IGitCommandsPanelProps): JSX.Element {
    return (
        <section data-id="git-commands-panel" className="flex flex-col gap-[var(--space-4)] p-[var(--space-4)]">
            <div className="flex flex-col gap-[var(--space-1)]">
                <h2 className="flex items-center gap-[var(--space-2)] text-[length:var(--text-lg)] font-[var(--weight-bold)] leading-[var(--leading-tight)] text-[var(--color-text)]">
                    <FontAwesomeIcon icon={faTerminal} className="text-[length:var(--icon-md)] text-[var(--color-accent)]" />
                    <span data-id="git-commands-heading" className="flex-1">
                        Git commands
                    </span>
                </h2>
                <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                    The Git commands this page ran. Copy one to run it in a terminal.
                </p>
            </div>
            {pageCommands === undefined && (
                <div className="flex flex-col items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-[var(--space-4)] py-[var(--space-6)] text-center text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                    <FontAwesomeIcon icon={faTerminal} className="text-[length:var(--icon-lg)]" />
                    <p data-id="git-commands-empty">
                        This page has run no Git commands.
                    </p>
                </div>
            )}
            {pageCommands !== undefined && (
                <>
                    <CommandBlock command={pageCommands.directoryCommand} textDataId="git-commands-directory" copyDataId="git-commands-directory-copy" />
                    <ol data-id="git-commands-list" className="flex flex-col gap-[var(--space-2)]">
                        {pageCommands.commands.map((command, index) => (
                            <li key={command} data-id={`git-command-${index}`} className="flex flex-col gap-[var(--space-1)]">
                                {index === 0 && (
                                    <span data-id="git-command-most-recent" className="text-[length:var(--text-xs)] font-[var(--weight-medium)] text-[var(--color-text-muted)]">
                                        Most recent
                                    </span>
                                )}
                                <CommandBlock command={command} textDataId={`git-command-${index}-text`} copyDataId={`git-command-${index}-copy`} />
                            </li>
                        ))}
                    </ol>
                </>
            )}
        </section>
    );
}
