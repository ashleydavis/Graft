//
// The keyboard shortcuts overlay: a dialog over the app that lists Graft's keyboard shortcuts,
// which the Keyboard Shortcuts action shows and closes.
//

import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog, DialogTitle, IconButton, List, ListSubheader } from "@mui/material";
import { Fragment, JSX, useEffect, useState } from "react";
import { PaneOrPage } from "../lib/active-pane";
import { actionShortcuts, isControlReleased, isShortcutsOverlayCtrlKey, IShortcut, matchingGroups, overlayShortcuts, shortcutGroups, shortcutKeyNames } from "../lib/shortcuts";
import { LabelTooltip } from "./tooltip";

//
// The name of the backend's Keyboard Shortcuts action (backend/src/features/shortcuts-overlay.zig),
// whose shortcut is `?`. The overlay registers its handler under this name and removes it under
// the same name. Ctrl+/ is matched by the overlay itself and listed under this name with "-ctrl"
// added.
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
// What the overlay is given: the pane or page the keys act on.
//
export interface IShortcutsOverlayProps {
    // The selected pane or page, whose keys the overlay lists first, or undefined when there is
    // none.
    paneOrPage: PaneOrPage | undefined;
}

//
// Shows the keyboard shortcuts overlay while it is open. It lists every shortcut in Ziggy's action
// list, which it reads once with window.ziggy.listActions, so each shortcut is written only where
// its action is declared and shows as the platform shows it. When the selected pane or page has
// keys of its own, the overlay lists them first, in a group headed by its name, and the shortcuts
// from the action list follow in a group headed "General", as the style guide's overlay groups its
// shortcuts. With no keys of its own the General group is the only one. The overlay is 520 pixels
// wide, or narrower when the window is, as the style guide's overlay is. The groups are listed in
// one column, which scrolls once it is taller than 360 pixels. A search box at the top has the
// focus when the overlay opens. What is typed there filters every group by label or keys and hides
// a group with no match. Each row is a ShortcutRow. The search box is a plain input styled with
// Tailwind, because a MaterialUI TextField on the page takes the padding and borders off the
// overlay and MaterialUI's other components. It registers the handler of the Keyboard Shortcuts action, so Ziggy runs it
// when the user presses `?` outside a text box: the handler opens the overlay when it is closed and
// closes it when it is open. The search box is a text box, so `?` typed there types a question
// mark. Escape, a click outside the overlay and the close button at the right of the title close
// the overlay, as the style guide's overlay does. The search is cleared each time the overlay
// closes. The handler is removed when the overlay goes, so a later overlay can register it again.
// When the list cannot be read, the overlay shows why in its place.
// Ctrl+/ also opens and closes the overlay, from anywhere in the window and from a text box too.
// Ziggy's shortcut syntax refuses `/` as a key, so the overlay listens for Ctrl+/ itself, on the
// window in the capture phase so it hears the key before any element does, and keeps the key from
// doing anything else, so a text box with the focus keeps its text. Ctrl+/ opens or closes the
// overlay once each time Control is held, so holding the keys long enough to repeat leaves the
// overlay as the first press left it. The list shows Ctrl+/ in a row of its own after the Keyboard
// Shortcuts action's `?`.
//
export function ShortcutsOverlay({ paneOrPage }: IShortcutsOverlayProps): JSX.Element {
    const [isOpen, setOpen] = useState(false);
    const [shortcuts, setShortcuts] = useState<IShortcut[]>([]);
    const [listError, setListError] = useState<string | undefined>(undefined);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        window.ziggy.listActions()
            .then(actions => {
                setShortcuts(overlayShortcuts(actionShortcuts(actions), shortcutsOverlayAction));
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

    useEffect(() => {
        //
        // Whether the next Ctrl+/ opens or closes the overlay: true until Ctrl+/ does, then false
        // until Control is released (isControlReleased), so a held Ctrl+/ whose repeats look like
        // new presses opens or closes the overlay once.
        //
        let isToggleAllowed = true;

        function onKeyDown(event: KeyboardEvent): void {
            if (isControlReleased(event)) {
                isToggleAllowed = true;
            }
            if (isShortcutsOverlayCtrlKey(event)) {
                event.preventDefault();
                if (isToggleAllowed) {
                    isToggleAllowed = false;
                    setOpen(wasOpen => !wasOpen);
                }
            }
        }

        function onKeyUp(event: KeyboardEvent): void {
            if (isControlReleased(event)) {
                isToggleAllowed = true;
            }
        }

        //
        // Allows the next Ctrl+/ when the window loses the focus, because Control released in
        // another window sends this window no keyup.
        //
        function onBlur(): void {
            isToggleAllowed = true;
        }

        window.addEventListener("keydown", onKeyDown, true);
        window.addEventListener("keyup", onKeyUp, true);
        window.addEventListener("blur", onBlur);
        return () => {
            window.removeEventListener("keydown", onKeyDown, true);
            window.removeEventListener("keyup", onKeyUp, true);
            window.removeEventListener("blur", onBlur);
        };
    }, []);

    const shownGroups = matchingGroups(shortcutGroups(paneOrPage, shortcuts), searchText);

    //
    // The overlay's container covers the window around the overlay, above the dimmed backdrop, so
    // a click outside the overlay lands on it, and its data-id lets a smoke test click outside.
    // MaterialUI's type for the container's props lists only its own props, while MaterialUI
    // passes data attributes on to the element, so they go in an object of their own, which
    // TypeScript checks less strictly than an object written in place.
    //
    const containerProps = {
        "data-id": "shortcuts-overlay-outside",
    };

    return (
        <Dialog
            data-id="shortcuts-overlay"
            open={isOpen}
            onClose={() => setOpen(false)}
            slotProps={{
                transition: {
                    onExited: () => setSearchText(""),
                },
                paper: {
                    className: "w-[520px] max-w-[calc(100%-var(--space-8))]",
                },
                container: containerProps,
            }}
            maxWidth={false}
        >
            <DialogTitle data-id="shortcuts-overlay-title" className="flex items-center gap-[var(--space-2)] pt-[var(--space-3)] pr-[var(--space-3)] pb-[var(--space-2)] pl-[var(--space-4)]">
                <span className="flex-1">Keyboard shortcuts</span>
                <LabelTooltip label="Close" placement="bottom">
                    <IconButton data-id="shortcuts-overlay-close" aria-label="Close" size="small" onClick={() => setOpen(false)}>
                        <FontAwesomeIcon icon={faXmark} />
                    </IconButton>
                </LabelTooltip>
            </DialogTitle>
            <div className="mx-[var(--space-4)] mb-[var(--space-2)] flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border-control)] bg-[var(--color-panel)] px-[var(--space-3)] py-[var(--space-1)] text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:border-[var(--color-text-muted)] focus-within:border-[var(--color-focus)]">
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
                    // bubble and Escape went to that bubble instead of the overlay: the
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
                <p data-id="shortcuts-overlay-error" className="mx-[var(--space-4)] mb-[var(--space-4)] rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-md)] text-[var(--color-text)]">
                    Graft could not read its keyboard shortcuts from Ziggy: {listError}. Ziggy's log has the details.
                </p>
            )}
            {listError === undefined && shownGroups.length === 0 && (
                <p data-id="shortcuts-overlay-no-match" className="p-[var(--space-4)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                    No shortcut matches "{searchText}".
                </p>
            )}
            <div data-id="shortcuts-overlay-columns" className="max-h-[360px] overflow-y-auto px-[var(--space-1)] pb-[var(--space-2)]">
                {shownGroups.map(group => (
                    <List
                        key={group.name}
                        data-id={`shortcut-group-${group.name}`}
                        dense={true}
                        disablePadding={true}
                        aria-label={group.title}
                        subheader={(
                            <ListSubheader component="div" data-id={`shortcut-group-${group.name}-title`}>
                                {group.title}
                            </ListSubheader>
                        )}
                    >
                        {group.shortcuts.map(shortcut => (
                            <ShortcutRow key={shortcut.name} shortcut={shortcut} />
                        ))}
                    </List>
                ))}
            </div>
        </Dialog>
    );
}

//
// What a row of the overlay is given: the shortcut it shows.
//
export interface IShortcutRowProps {
    // The shortcut, whose name the row's data-ids are built from.
    shortcut: IShortcut;
}

//
// Shows one shortcut of the overlay: its label on one line, a dotted line that leads the eye across
// and its keys as key caps, as the style guide's overlay does.
//
export function ShortcutRow({ shortcut }: IShortcutRowProps): JSX.Element {
    return (
        <li data-id={`shortcut-${shortcut.name}`} className="flex items-baseline gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--text-md)]">
            <span data-id={`shortcut-${shortcut.name}-label`} className="whitespace-nowrap text-[var(--color-text)]">
                {shortcut.label}
            </span>
            <span aria-hidden="true" className="inline-block h-0 min-w-[var(--space-4)] flex-[1_1_var(--space-4)] border-b border-dotted border-[var(--color-border)]" />
            <KeyCaps keys={shortcut.keys} dataId={`shortcut-${shortcut.name}-keys`} />
        </li>
    );
}
