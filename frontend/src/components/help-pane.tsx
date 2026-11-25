//
// The Help pane: the part of the right sidebar under the Git commands panel that shows help for
// the selected pane or page.
//

import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { JSX } from "react";
import { IViewHelp } from "../lib/context-help";
import { KeyCaps } from "./shortcuts-overlay";

//
// The help the pane shows.
//
export interface IHelpPaneProps {
    // The help for the selected pane or page, or undefined on a path with no page of its own.
    help: IViewHelp | undefined;
}

//
// Shows the heading "Help" with the question mark icon, laid out and coloured as the Git commands
// panel above it is, so the right sidebar reads as one set of help about what is on screen. Under
// it are the pane's or page's name, what it shows, then the keys that work in it, each drawn as
// key caps as the Help page and the keyboard shortcuts overlay draw them, with what they do, then
// what a click does. For a page it shows the page's name and what it is for alone, because the
// keyboard shortcuts overlay lists a page's keys. A path with no page of its own shows "There is
// no help for this page."
//
export function HelpPane({ help }: IHelpPaneProps): JSX.Element {
    return (
        <section data-id="help-pane" className="flex flex-col gap-[var(--space-3)] border-t border-[var(--color-border)] p-[var(--space-4)]">
            <h2 className="flex items-center gap-[var(--space-2)] text-[length:var(--text-lg)] font-[var(--weight-bold)] leading-[var(--leading-tight)] text-[var(--color-text)]">
                <FontAwesomeIcon icon={faCircleQuestion} className="text-[length:var(--icon-md)] text-[var(--color-accent)]" />
                <span data-id="help-pane-heading" className="flex-1">
                    Help
                </span>
            </h2>
            {help === undefined && (
                <p data-id="help-pane-empty" className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                    There is no help for this page.
                </p>
            )}
            {help !== undefined && (
                <>
                    <div className="flex flex-col gap-[var(--space-1)]">
                        <h3 data-id="help-pane-name" className="text-[length:var(--text-md)] font-[var(--weight-medium)] text-[var(--color-text)]">
                            {help.name}
                        </h3>
                        <p data-id="help-pane-description" className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                            {help.description}
                        </p>
                    </div>
                    {help.keys.length > 0 && (
                        <dl data-id="help-pane-keys" className="flex flex-col gap-[var(--space-2)]">
                            {help.keys.map((keyHelp, index) => (
                                <div key={index} data-id={`help-pane-key-${index}`} className="flex flex-col gap-[var(--space-1)]">
                                    <dt className="flex flex-wrap items-center gap-[var(--space-1)]">
                                        {keyHelp.keys.map(key => (
                                            <KeyCaps key={key} keys={key} dataId={`help-pane-key-${index}-${key}`} />
                                        ))}
                                    </dt>
                                    <dd data-id={`help-pane-key-${index}-text`} className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                                        {keyHelp.text}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}
                    {help.clicks.length > 0 && (
                        <ul data-id="help-pane-clicks" className="flex list-disc flex-col gap-[var(--space-1)] pl-[var(--space-4)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                            {help.clicks.map((click, index) => (
                                <li key={index} data-id={`help-pane-click-${index}`}>
                                    {click}
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </section>
    );
}
