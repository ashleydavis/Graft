//
// The keyboard shortcuts overlay: a dialog over the app that lists Graft's keyboard shortcuts,
// which the Keyboard Shortcuts action shows and closes.
//

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { Fragment, JSX, useEffect, useState } from "react";
import { actionShortcuts, IShortcut, matchingShortcuts, shortcutColumns, shortcutKeyNames } from "../lib/shortcuts";

//
// The name of the backend's Keyboard Shortcuts action (backend/src/lib/actions.zig), whose shortcut
// is `?`. The overlay registers its handler under this name and removes it under the same name.
//
export const shortcutsOverlayAction = "toggle-shortcuts-overlay";

//
// What the key caps of one shortcut show and how a smoke test finds them.
//
export interface IKeyCapsProps {
    // The keys as the platform shows them, such as "Ctrl+O".
    keys: string;

    // The data-id of the key caps.
    dataId: string;
}

//
// Shows a shortcut's keys as the style guide's key caps, one for each key pressed together. The
// "+" between two caps is kept for screen readers and hidden from sight, so the caps' text is the
// keys as the platform shows them, which the smoke tests read.
//
export function KeyCaps({ keys, dataId }: IKeyCapsProps): JSX.Element {
    return (
        <span data-id={dataId} className="inline-flex flex-none flex-wrap items-center justify-end gap-[var(--space-1)]">
            {shortcutKeyNames(keys).map((key, index) => (
                <Fragment key={index}>
                    {index > 0 && <span className="sr-only">+</span>}
                    <kbd className="min-w-[var(--space-6)] rounded-[var(--radius-sm)] border border-b-2 border-[var(--color-border)] bg-[var(--color-raised)] px-[var(--space-1)] text-center font-[family-name:var(--font-mono)] text-[length:var(--text-xs)] leading-[var(--leading-normal)] text-[var(--color-text)]">
                        {key}
                    </kbd>
                </Fragment>
            ))}
        </span>
    );
}

//
// Shows the keyboard shortcuts overlay while it is open. It lists every shortcut in Ziggy's action
// list, which it reads once with window.ziggy.listActions, so each shortcut is written only where
// its action is declared and shows as the platform shows it. The shortcuts are laid out in columns
// that each fill before the next one starts. A search box at the top has the focus when the overlay
// opens, and what is typed there filters the list by label or keys. Each row shows the shortcut's
// label, a dotted line that leads the eye across and its keys as key caps, as the style guide's
// overlay does. The search box is a plain input styled with Tailwind, because a MaterialUI
// TextField on the page takes the padding and borders off the overlay and MaterialUI's other
// components. It registers the handler of the
// Keyboard Shortcuts action, so Ziggy runs it when the user presses `?` outside a text box: the
// handler opens the overlay when it is closed and closes it when it is open. The search box is a
// text box, so `?` typed there types a question mark. Escape closes the overlay. A click outside
// the overlay leaves it open. The search is cleared each time the overlay closes. The handler is
// removed when the overlay goes, so a later overlay can register it again. When the list cannot be
// read, the overlay shows why in its place.
//
export function ShortcutsOverlay(): JSX.Element {
    const [isOpen, setOpen] = useState(false);
    const [shortcuts, setShortcuts] = useState<IShortcut[]>([]);
    const [listError, setListError] = useState<string | undefined>(undefined);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        window.ziggy.listActions()
            .then(actions => {
                setShortcuts(actionShortcuts(actions));
            })
            .catch(error => {
                setListError(String(error));
            });
    }, []);

    useEffect(() => {
        window.ziggy.registerAction(shortcutsOverlayAction, () => {
            setOpen(wasOpen => !wasOpen);
        });
        return () => {
            window.ziggy.removeAction(shortcutsOverlayAction);
        };
    }, []);

    const columns = shortcutColumns(matchingShortcuts(shortcuts, searchText));

    return (
        <Dialog
            data-id="shortcuts-overlay"
            open={isOpen}
            onClose={(_event, reason) => {
                if (reason === "escapeKeyDown") {
                    setOpen(false);
                }
            }}
            slotProps={{
                transition: {
                    onExited: () => setSearchText(""),
                },
            }}
            fullWidth={true}
            maxWidth="md"
        >
            <DialogTitle data-id="shortcuts-overlay-title">
                Keyboard shortcuts
            </DialogTitle>
            <DialogContent>
                <div className="flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border-control)] bg-[var(--color-panel)] px-[var(--space-3)] py-[var(--space-1)] text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:border-[var(--color-text-muted)] focus-within:border-[var(--color-focus)]">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[length:var(--icon-md)]" />
                    <input
                        type="text"
                        data-id="shortcuts-overlay-search"
                        autoFocus={true}
                        placeholder="Search shortcuts"
                        aria-label="Search shortcuts"
                        //
                        // The search box takes action names and keys, not prose, so spelling
                        // correction is off. On macOS it offered to correct "quit" to "Quit" in a
                        // bubble, and Escape went to that bubble instead of the overlay: the
                        // shortcuts-overlay smoke test failed in the Release macOS arm64 workflow
                        // with "the page still showed shortcuts-overlay" after Escape.
                        //
                        spellCheck={false}
                        autoCorrect="off"
                        value={searchText}
                        onChange={event => setSearchText(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent py-[var(--space-1)] text-[length:var(--text-md)] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
                    />
                </div>
                {listError !== undefined && (
                    <p data-id="shortcuts-overlay-error" className="mt-[var(--space-3)] rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-md)] text-[var(--color-text)]">
                        Graft could not read its keyboard shortcuts from Ziggy: {listError}. Ziggy's log has the details.
                    </p>
                )}
                {listError === undefined && columns.length === 0 && (
                    <p data-id="shortcuts-overlay-no-match" className="pt-[var(--space-3)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                        No shortcut matches "{searchText}".
                    </p>
                )}
                <div data-id="shortcuts-overlay-columns" className="flex gap-[var(--space-8)] pt-[var(--space-3)]">
                    {columns.map(column => (
                        <ul key={column[0].name} className="min-w-0 flex-1">
                            {column.map(shortcut => (
                                <li key={shortcut.name} data-id={`shortcut-${shortcut.name}`} className="flex items-baseline gap-[var(--space-2)] py-[var(--space-1)] text-[length:var(--text-md)]">
                                    <span data-id={`shortcut-${shortcut.name}-label`} className="text-[var(--color-text)]">
                                        {shortcut.label}
                                    </span>
                                    <span aria-hidden="true" className="inline-block h-0 min-w-[var(--space-4)] flex-[1_1_var(--space-4)] border-b border-dotted border-[var(--color-border)]" />
                                    <KeyCaps keys={shortcut.keys} dataId={`shortcut-${shortcut.name}-keys`} />
                                </li>
                            ))}
                        </ul>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
