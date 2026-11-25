//
// The command palette: a search box over a list of Graft's commands, opened over the page by the
// Command Palette action, with the commands of the selected pane or page listed first.
//

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog, ListItemButton } from "@mui/material";
import { JSX, KeyboardEvent, useEffect, useState } from "react";
import { PaneOrPage } from "../lib/active-pane";
import { commandGroups, ICommand, matchingGroups, movedHighlightIndex, paletteCommands, shownCommands } from "../lib/command-palette";
import { KeyCaps } from "./shortcuts-overlay";

//
// The name of the backend's Command Palette action (backend/src/features/command-palette.zig),
// whose shortcut is CmdOrCtrl+Shift+P. The palette registers its handler under this name, removes
// it under the same name and leaves it out of its own list.
//
export const commandPaletteAction = "show-command-palette";

//
// What the palette is given: the selected pane or page, whose commands it lists first.
//
export interface ICommandPaletteProps {
    // The selected pane or page, or undefined when the page shown is none of Graft's.
    paneOrPage: PaneOrPage | undefined;
}

//
// Shows the command palette while it is open, near the top of the window with the page behind it
// dimmed, laid out as the style guide's command palette. It reads Graft's commands once with
// window.ziggy.listActions and lists every one but its own action, those of the selected pane or
// page first under the pane or page's name and the rest under "Other commands". It registers the
// handler of the Command Palette action, so Ziggy opens it when the user presses Ctrl+Shift+P
// (Cmd+Shift+P on macOS), from a text box too. The search box has the focus when the palette opens.
// Typing there filters both groups by label. The first command shown is highlighted, Up and Down
// move the highlight and Enter runs the highlighted command, and a click runs the clicked one.
// Running a command closes the palette and runs the action with window.ziggy.runAction, after the
// palette has closed so the action's own dialog, such as the keyboard shortcuts overlay, keeps the
// focus. When the action cannot be run, the palette opens again and shows why. Escape or a click
// outside closes it and runs no command. The search is cleared each time the palette closes. When
// the list cannot be read, the palette shows why in its place. The search box is a plain input
// styled with Tailwind, as the keyboard shortcuts overlay's is.
//
export function CommandPalette({ paneOrPage }: ICommandPaletteProps): JSX.Element {
    const [isOpen, setOpen] = useState(false);
    const [commands, setCommands] = useState<ICommand[]>([]);
    const [listError, setListError] = useState<string | undefined>(undefined);
    const [runError, setRunError] = useState<string | undefined>(undefined);
    const [searchText, setSearchText] = useState("");
    const [highlightIndex, setHighlightIndex] = useState(0);

    useEffect(() => {
        window.ziggy.listActions()
            .then(actions => {
                setCommands(paletteCommands(actions, commandPaletteAction));
            })
            .catch(error => {
                setListError(String(error));
            });
    }, []);

    useEffect(() => {
        window.ziggy.registerAction(commandPaletteAction, () => {
            setRunError(undefined);
            setOpen(true);
        });
        return () => {
            window.ziggy.removeAction(commandPaletteAction);
        };
    }, []);

    const groups = matchingGroups(commandGroups(commands, paneOrPage), searchText);
    const shown = shownCommands(groups);

    //
    // Closes the palette and runs the command's action. When Ziggy cannot run it, the palette opens
    // again and shows why.
    //
    function runCommand(command: ICommand): void {
        setOpen(false);
        window.ziggy.runAction(command.name).catch(error => {
            setRunError(`Graft could not run "${command.label}": ${String(error)}. Ziggy's log has the details.`);
            setOpen(true);
        });
    }

    function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
        if (event.key === "Enter") {
            event.preventDefault();
            const command = shown[highlightIndex];
            if (command) {
                runCommand(command);
            }
            return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightIndex(movedHighlightIndex(highlightIndex, event.key, shown.length));
        }
    }

    return (
        <Dialog
            data-id="command-palette"
            open={isOpen}
            onClose={() => setOpen(false)}
            maxWidth={false}
            sx={{
                "& .MuiDialog-container": {
                    alignItems: "flex-start",
                },
            }}
            slotProps={{
                transition: {
                    onExited: () => {
                        setSearchText("");
                        setHighlightIndex(0);
                    },
                },
                paper: {
                    "aria-label": "Command palette",
                    className: "mt-[15vh] w-[480px] max-w-[calc(100%-var(--space-8))] overflow-hidden",
                },
            }}
        >
            <div className="flex items-center gap-[var(--space-2)] border-b border-[var(--color-border)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--color-text-muted)]">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[length:var(--icon-md)]" />
                <input
                    type="text"
                    data-id="command-palette-search"
                    autoFocus={true}
                    placeholder="Type a command"
                    aria-label="Command"
                    //
                    // The search box takes command names, so spelling correction is off, as it
                    // is in the keyboard shortcuts overlay's search box, where macOS's
                    // correction bubble took Escape from the overlay.
                    //
                    spellCheck={false}
                    autoCorrect="off"
                    value={searchText}
                    onChange={event => {
                        setSearchText(event.target.value);
                        setHighlightIndex(0);
                    }}
                    onKeyDown={onSearchKeyDown}
                    className="min-w-0 flex-1 bg-transparent py-[var(--space-1)] font-[family-name:var(--font-sans)] text-[length:var(--text-lg)] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
                />
            </div>
            {runError !== undefined && (
                <p data-id="command-palette-run-error" className="mx-[var(--space-3)] mt-[var(--space-2)] rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-md)] text-[var(--color-text)]">
                    {runError}
                </p>
            )}
            {listError !== undefined && (
                <p data-id="command-palette-error" className="m-[var(--space-3)] rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-md)] text-[var(--color-text)]">
                    Graft could not read its commands from Ziggy: {listError}. Ziggy's log has the details.
                </p>
            )}
            {listError === undefined && shown.length === 0 && (
                <p data-id="command-palette-no-match" className="px-[var(--space-3)] py-[var(--space-4)] text-[var(--color-text-muted)]">
                    No command matches "{searchText}".
                </p>
            )}
            {listError === undefined && shown.length > 0 && (
                <div data-id="command-palette-list" role="listbox" aria-label="Commands" className="max-h-[280px] overflow-y-auto p-[var(--space-1)]">
                    {groups.map(group => (
                        <div key={group.id} data-id={`command-palette-group-${group.id}`} role="group" aria-label={group.title}>
                            <div data-id={`command-palette-group-${group.id}-title`} className="px-[var(--space-3)] pt-[var(--space-2)] pb-[var(--space-1)] font-[family-name:var(--font-sans)] text-[length:var(--text-sm)] font-[number:var(--weight-bold)] leading-[var(--leading-normal)] text-[var(--color-text-muted)]">
                                {group.title}
                            </div>
                            {group.commands.map(command => {
                                const index = shown.indexOf(command);
                                return (
                                    <ListItemButton
                                        key={command.name}
                                        data-id={`command-${command.name}`}
                                        role="option"
                                        aria-selected={index === highlightIndex}
                                        selected={index === highlightIndex}
                                        onClick={() => runCommand(command)}
                                        onMouseMove={() => setHighlightIndex(index)}
                                        className="items-baseline gap-[var(--space-2)] text-[length:var(--text-md)]"
                                    >
                                        <span data-id={`command-${command.name}-label`} className="flex-1 text-[var(--color-text)]">
                                            {command.label}
                                        </span>
                                        {command.keys !== undefined && (
                                            <KeyCaps keys={command.keys} dataId={`command-${command.name}-keys`} />
                                        )}
                                    </ListItemButton>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </Dialog>
    );
}
