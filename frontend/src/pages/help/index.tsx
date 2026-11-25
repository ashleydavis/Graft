//
// The Help page: a short guide to Graft's pages and the ways to move between them.
//

import { JSX } from "react";
import { KeyCaps } from "../../components/shortcuts-overlay";
import { PAGE_HELP } from "../../lib/context-help";
import { HelpEntry } from "./components/help-entry";

//
// Shows the heading "Help", a line saying what the page holds, then a section of Graft's pages
// and what each is for, read from PAGE_HELP, which the right sidebar's Help pane also reads, and a
// section of the ways to move between them. The keyboard section names `?`, the key of the
// keyboard shortcuts overlay, and leaves every other key to the overlay, which shows each in the
// platform's own form, Ctrl on Linux and Windows and Cmd on macOS. The page is
// laid out as the About page is, with the style guide's page title and section heading sizes, so
// Graft's pages about the app look the same.
//
export function HelpPage(): JSX.Element {
    return (
        <main data-id="help-page" className="graft-page-in flex max-w-3xl flex-col items-start gap-[var(--space-6)] p-[var(--space-6)]">
            <div className="flex flex-col gap-[var(--space-2)]">
                <h1 data-id="help-heading" className="text-[length:var(--text-2xl)] font-[var(--weight-bold)] leading-[var(--leading-tight)] text-[var(--color-text)]">
                    Help
                </h1>
                <p data-id="help-description">
                    Graft shows one page at a time in the middle of its window. These are its pages and the ways to move between them.
                </p>
            </div>
            <section data-id="help-pages-section" className="flex flex-col gap-[var(--space-3)]">
                <h2 data-id="help-pages-heading" className="text-[length:var(--text-xl)] font-[var(--weight-bold)] leading-[var(--leading-tight)] text-[var(--color-text)]">
                    Pages
                </h2>
                <dl className="flex flex-col gap-[var(--space-3)]">
                    {Object.values(PAGE_HELP).map(page => (
                        <HelpEntry key={page.id} term={page.name} dataId={`help-${page.id}`}>
                            {page.description}
                        </HelpEntry>
                    ))}
                </dl>
            </section>
            <section data-id="help-moving-section" className="flex flex-col gap-[var(--space-3)]">
                <h2 data-id="help-moving-heading" className="text-[length:var(--text-xl)] font-[var(--weight-bold)] leading-[var(--leading-tight)] text-[var(--color-text)]">
                    Moving between pages
                </h2>
                <dl className="flex flex-col gap-[var(--space-3)]">
                    <HelpEntry term="Left sidebar" dataId="help-left-sidebar">
                        Repo explorer is at the top while a repo is open. Help and About are at the bottom. The menu button at the left of the top bar shrinks the sidebar to its icons and expands it again.
                    </HelpEntry>
                    <HelpEntry term="Breadcrumb trail" dataId="help-breadcrumb-trail">
                        The top bar shows the open repo and the page you are on. On the Help and About pages, click the page's name to switch between them.
                    </HelpEntry>
                    <HelpEntry term="File menu" dataId="help-file-menu">
                        Open repo opens a local Git repo in the repo explorer. New window opens another Graft window on the welcome page.
                    </HelpEntry>
                    <HelpEntry term="Keyboard" dataId="help-keyboard">
                        Press <KeyCaps keys="?" dataId="help-shortcuts-key" /> to list Graft's keyboard shortcuts, such as the ones that open a repo and return to the repo explorer.
                    </HelpEntry>
                </dl>
            </section>
        </main>
    );
}
