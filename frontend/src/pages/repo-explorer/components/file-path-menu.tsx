//
// The file path menu: the small drop-down button beside a file path, as in the style guide, with
// the ways to copy the path and to open the file outside Graft.
//

import { faCheck, faChevronDown, faCopy, faFile, faFolderOpen, faPenToSquare, faRoute, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClickAwayListener, Divider, IconButton, ListItemIcon, ListItemText, MenuItem, MenuList, Paper, Popper, Tooltip } from "@mui/material";
import { JSX, KeyboardEvent, MouseEvent, useEffect, useState } from "react";
import { copyText, COPIED_DURATION_MS } from "../../../components/copy-button";
import { copyItems, fileManagerLabel, fileName, openFile, OpenTarget } from "../../../lib/file-path-menu";

//
// The style a row that holds a file path menu adds, so the menu's button shows only on the row
// under the pointer, the selected row and a row with the keyboard in it, as the style guide's file
// rows show it. The button keeps its space, so the row's path keeps its place when it shows. It is
// a MaterialUI style rather than Tailwind classes because it reads the row's selected class.
//
export const filePathMenuRowStyle = {
    "& .file-path-menu": {
        opacity: 0,
        transition: "opacity var(--duration-fast) var(--ease-standard)",
    },
    "&:hover .file-path-menu, &.Mui-selected .file-path-menu, &:focus-within .file-path-menu": {
        opacity: 1,
    },
};

//
// The icon of each copy item, by its data-id: the copy icon for the full path, the route icon for
// the path from the repo's root and the file icon for the name, as in the style guide.
//
const copyItemIcons: Record<string, IconDefinition> = {
    "file-path-menu-copy-full": faCopy,
    "file-path-menu-copy-relative": faRoute,
    "file-path-menu-copy-name": faFile,
};

//
// What the file path menu is for and how a smoke test finds its button.
//
export interface IFilePathMenuProps {
    // The path of the repo the file is in.
    repoPath: string;

    // The path of the file from the root of the repo.
    path: string;

    // The data-id of the button.
    dataId: string;
}

//
// Shows the button: a copy icon and a small chevron. A click opens the menu below it with the copy
// items, a divider, the file manager item named for the platform and "Open in editor". It reads the
// platform from Ziggy when the menu first opens, because only the menu's items need it. A copy item
// copies its text and closes the menu, then the button shows a tick in the success colour for
// COPIED_DURATION_MS. An open item queues the backend's task that opens the file and closes the
// menu once it has, or shows why it could not below the items. A click on the button or the menu
// stays with them and never reaches the row they sit in. Escape or Tab closes the menu and puts the
// keyboard back on the button, and a click outside closes it. The button stays in view while its
// menu is open, even in a row that shows it only on hover.
//
export function FilePathMenu({ repoPath, path, dataId }: IFilePathMenuProps): JSX.Element {
    const [anchor, setAnchor] = useState<HTMLElement | undefined>(undefined);
    const [os, setOs] = useState<string | undefined>(undefined);
    const [isCopied, setCopied] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!isCopied) {
            return undefined;
        }
        const timer = setTimeout(() => setCopied(false), COPIED_DURATION_MS);
        return () => clearTimeout(timer);
    }, [isCopied]);

    function close(): void {
        setAnchor(undefined);
        setError(undefined);
    }

    function toggle(event: MouseEvent<HTMLElement>): void {
        event.stopPropagation();
        if (anchor !== undefined) {
            close();
            return;
        }
        setAnchor(event.currentTarget);
        if (os === undefined) {
            window.ziggy.getPlatform()
                .then(platform => setOs(platform.os))
                .catch(platformError => setError(`Graft could not read which platform it runs on: ${String(platformError)}. Close the menu and open it again.`));
        }
    }

    function onMenuKey(event: KeyboardEvent): void {
        if (["Escape", "Tab"].includes(event.key)) {
            event.preventDefault();
            event.stopPropagation();
            anchor?.focus();
            close();
        }
    }

    function copy(text: string): void {
        close();
        copyText(text, () => setCopied(true));
    }

    function open(target: OpenTarget): void {
        setError(undefined);
        openFile({
            taskId: `open-file-${Date.now()}-${Math.random()}`,
            repoPath,
            path,
            target,
        }, result => {
            if (result.ok) {
                close();
            }
            else {
                setError(result.error.message);
            }
        });
    }

    let label = `Path actions for ${fileName(path)}`;
    let tip = "Copy or open";
    let buttonClass = "";
    let buttonIcon = faCopy;
    if (isCopied) {
        buttonIcon = faCheck;
        label = "Copied";
        tip = "Copied";
        buttonClass = "text-[var(--color-success)] hover:text-[var(--color-success)]";
    }
    let spanClass = "file-path-menu inline-flex flex-none";
    if (anchor !== undefined) {
        spanClass = "file-path-menu inline-flex flex-none !opacity-100";
    }

    return (
        <span className={spanClass} onClick={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
            <Tooltip title={tip}>
                <IconButton
                    data-id={dataId}
                    size="small"
                    aria-label={label}
                    aria-haspopup="menu"
                    aria-expanded={anchor !== undefined}
                    onClick={toggle}
                    className={`w-auto gap-[2px] px-[var(--space-1)] ${buttonClass}`}
                >
                    <FontAwesomeIcon icon={buttonIcon} />
                    <FontAwesomeIcon icon={faChevronDown} className="text-[length:calc(var(--icon-sm)*0.75)]" />
                </IconButton>
            </Tooltip>
            <Popper open={anchor !== undefined} anchorEl={anchor} placement="bottom-start" popperOptions={{
                strategy: "fixed",
            }} className="z-[1300]">
                <ClickAwayListener
                    mouseEvent="onMouseDown"
                    onClickAway={event => {
                        if (event.target instanceof Node) {
                            if (anchor?.contains(event.target)) {
                                return;
                            }
                        }
                        close();
                    }}
                >
                    <Paper variant="overlay" data-id="file-path-menu" className="mt-[var(--space-1)] max-w-[calc(var(--space-8)*12)]">
                        {os !== undefined && (
                            <MenuList autoFocusItem={true} onKeyDown={onMenuKey} className="px-[var(--space-1)] py-[var(--space-2)]">
                                {copyItems({
                                    repoPath,
                                    path,
                                    os,
                                }).map(item => (
                                    <MenuItem key={item.dataId} data-id={item.dataId} onClick={() => copy(item.text)}>
                                        <ListItemIcon>
                                            <FontAwesomeIcon icon={copyItemIcons[item.dataId]} />
                                        </ListItemIcon>
                                        <ListItemText>{item.label}</ListItemText>
                                    </MenuItem>
                                ))}
                                <Divider />
                                <MenuItem data-id="file-path-menu-file-manager" onClick={() => open("file-manager")}>
                                    <ListItemIcon>
                                        <FontAwesomeIcon icon={faFolderOpen} />
                                    </ListItemIcon>
                                    <ListItemText>{fileManagerLabel(os)}</ListItemText>
                                </MenuItem>
                                <MenuItem data-id="file-path-menu-editor" onClick={() => open("editor")}>
                                    <ListItemIcon>
                                        <FontAwesomeIcon icon={faPenToSquare} />
                                    </ListItemIcon>
                                    <ListItemText>Open in editor</ListItemText>
                                </MenuItem>
                            </MenuList>
                        )}
                        {error !== undefined && (
                            <p data-id="file-path-menu-error" role="alert" className="m-2 whitespace-pre-wrap rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[length:var(--text-sm)] text-[var(--color-text)] [overflow-wrap:anywhere]">{error}</p>
                        )}
                    </Paper>
                </ClickAwayListener>
            </Popper>
        </span>
    );
}
