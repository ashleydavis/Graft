//
// The keyboard shortcuts overlay: a dialog over the app that lists Graft's keyboard shortcuts,
// which the Keyboard Shortcuts action shows and closes.
//

import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { JSX, useEffect, useState } from "react";
import { actionShortcuts, IShortcut, matchingShortcuts, shortcutColumns } from "../lib/shortcuts";

//
// The name of the backend's Keyboard Shortcuts action (backend/src/lib/actions.zig), whose shortcut
// is `?`. The overlay registers its handler under this name and removes it under the same name.
//
export const shortcutsOverlayAction = "toggle-shortcuts-overlay";

//
// Shows the keyboard shortcuts overlay while it is open. It lists every shortcut in Ziggy's action
// list, which it reads once with window.ziggy.listActions, so each shortcut is written only where
// its action is declared and shows as the platform shows it. The shortcuts are laid out in columns
// that each fill before the next one starts. A search box at the top has the focus when the overlay
// opens, and what is typed there filters the list by label or keys. The search box is a plain
// input styled with Tailwind, because a MaterialUI TextField on the page takes the padding and
// borders off the overlay and MaterialUI's other components. It registers the handler of the
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
                <input
                    type="text"
                    data-id="shortcuts-overlay-search"
                    autoFocus={true}
                    placeholder="Search"
                    //
                    // The search box takes action names and keys, not prose, so spelling correction
                    // is off. On macOS it offered to correct "quit" to "Quit" in a bubble, and
                    // Escape went to that bubble instead of the overlay: the shortcuts-overlay smoke
                    // test failed in the Release macOS arm64 workflow with "the page still showed
                    // shortcuts-overlay" after Escape.
                    //
                    spellCheck={false}
                    autoCorrect="off"
                    value={searchText}
                    onChange={event => setSearchText(event.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-control)] bg-[var(--color-panel)] px-3 py-2 text-[length:var(--text-md)] text-[var(--color-text)] outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] placeholder:text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)] focus:border-[var(--color-focus)]"
                />
                {listError !== undefined && (
                    <p data-id="shortcuts-overlay-error" className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[length:var(--text-md)] text-[var(--color-text)]">
                        Graft could not read its keyboard shortcuts from Ziggy: {listError}. Ziggy's log has the details.
                    </p>
                )}
                {listError === undefined && columns.length === 0 && (
                    <p data-id="shortcuts-overlay-no-match" className="pt-3 text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                        No shortcut matches "{searchText}".
                    </p>
                )}
                <div data-id="shortcuts-overlay-columns" className="flex gap-8 pt-4">
                    {columns.map(column => (
                        <ul key={column[0].name} className="min-w-0 flex-1">
                            {column.map(shortcut => (
                                <li key={shortcut.name} data-id={`shortcut-${shortcut.name}`} className="-mx-2 flex items-center justify-between gap-4 rounded-[var(--radius-sm)] px-2 py-1 text-[length:var(--text-md)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-[var(--color-hover)]">
                                    <span data-id={`shortcut-${shortcut.name}-label`} className="text-[var(--color-text)]">
                                        {shortcut.label}
                                    </span>
                                    <kbd data-id={`shortcut-${shortcut.name}-keys`} className="rounded-[var(--radius-md)] border border-[var(--color-border-control)] bg-[var(--color-raised)] px-1.5 font-[family-name:var(--font-mono)] text-[length:var(--text-xs)] text-[var(--color-text)] shadow-[inset_0_-1px_0_var(--color-border-control)]">
                                        {shortcut.keys}
                                    </kbd>
                                </li>
                            ))}
                        </ul>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
