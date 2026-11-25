//
// The top bar: the bar across the top of the window with Graft's name, the breadcrumb trail, the
// reminder of the key that shows the keyboard shortcuts, the button that shows them, the theme menu
// and the buttons that minimise and expand the left sidebar and slide the right sidebar in and out.
//

import { faBars, faKeyboard, faTableColumns } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton } from "@mui/material";
import { JSX } from "react";
import { ITrailStep } from "../lib/breadcrumb-trail";
import { shortcutsOverlayCtrlKeys } from "../lib/shortcuts";
import { ThemeSetting } from "../lib/theme";
import { BreadcrumbTrail } from "./breadcrumb-trail";
import { shortcutsOverlayAction } from "./shortcuts-overlay";
import { ThemeMenu } from "./theme-menu";
import { LabelTooltip, ShortcutTooltip } from "./tooltip";

//
// The text of the keyboard shortcuts button's label and tooltip, naming what a click does.
//
export const shortcutsButtonLabel = "Show keyboard shortcuts";

//
// Logs that the top bar's keyboard shortcuts button could not run the Keyboard Shortcuts action,
// with what to look at, because the button has no other way to report it.
//
export function reportShortcutsButtonFailure(error: unknown): void {
    console.error(`Graft could not run the ${shortcutsOverlayAction} action from the top bar's keyboard shortcuts button: ${String(error)}. The keyboard shortcuts overlay did not open, so look at Ziggy's log for why the action failed. ${shortcutsOverlayCtrlKeys} and ? still open it.`);
}

//
// What the top bar shows and what its buttons change. The layout owns both sidebars' states, so
// the top bar is told them and asks the layout to change them.
//
export interface ITopBarProps {
    // Whether the left sidebar is minimised to a strip of icons, so the button says what it does.
    isLeftSidebarMinimised: boolean;

    // Minimises the left sidebar when it is expanded and expands it when it is minimised.
    onToggleLeftSidebar(): void;

    // Whether the right sidebar is open, so the button says what it does.
    isRightSidebarOpen: boolean;

    // Slides the right sidebar in when it is closed and out when it is open.
    onToggleRightSidebar(): void;

    // The steps of the breadcrumb trail, from the repo to the page being shown.
    trail: ITrailStep[];

    // Opens the page at the path, for the trail's drop-downs.
    onNavigate(path: string): void;

    // The theme the user picked, which the theme menu shows.
    themeSetting: ThemeSetting;

    // Changes the theme to the one the user chose from the theme menu.
    onChooseThemeSetting(setting: ThemeSetting): void;
}

//
// Shows the menu button that minimises and expands the left sidebar at the left, Graft's name next
// to it and the button that slides the right sidebar in and out at the right, so each button sits
// on the side of the sidebar it moves. The theme menu's button sits just inside the right sidebar's
// button and shows the theme in use. Each button's label and tooltip say what a click does, in
// Graft's shared label tooltip.
// The breadcrumb trail takes the free space between them, set off by a divider, so it says where
// the user is without moving the buttons. After the trail the bar always shows "Ctrl+/: Show
// hotkeys", to remind the user of the key that shows the keyboard shortcuts overlay. It is styled
// as the style guide shows a shortcut beside a command: small, muted and in the code font, kept on
// one line. Between the reminder and the theme menu's button sits the keyboard shortcuts button,
// so the button is beside the reminder of its key. A click runs the Keyboard Shortcuts action, the
// one `?` runs, whose handler the overlay registers, so the overlay opens the same way from both.
// Its tooltip is the shared tooltip with a shortcut, which names the button's action and Ctrl+/.
//
export function TopBar({ isLeftSidebarMinimised, onToggleLeftSidebar, isRightSidebarOpen, onToggleRightSidebar, trail, onNavigate, themeSetting, onChooseThemeSetting }: ITopBarProps): JSX.Element {
    const leftSidebarLabel = isLeftSidebarMinimised ? "Expand the left sidebar" : "Minimise the left sidebar";
    const rightSidebarLabel = isRightSidebarOpen ? "Close the right sidebar" : "Open the right sidebar";

    return (
        <header data-id="top-bar" className="relative z-10 flex h-12 shrink-0 items-center gap-[var(--space-2)] border-b border-[var(--color-border)] bg-[var(--color-panel)] px-[var(--space-2)] shadow-[var(--shadow-raised)]">
            <LabelTooltip label={leftSidebarLabel} placement="bottom">
                <IconButton data-id="left-sidebar-toggle" aria-label={leftSidebarLabel} size="small" onClick={onToggleLeftSidebar}>
                    <FontAwesomeIcon icon={faBars} />
                </IconButton>
            </LabelTooltip>
            <span data-id="top-bar-name" className="select-none px-[var(--space-1)] text-[length:var(--text-lg)] font-[var(--weight-bold)] leading-[var(--leading-tight)] text-[var(--color-text)]">
                Graft
            </span>
            <div data-id="top-bar-trail" className="mx-[var(--space-2)] flex min-w-0 flex-1 items-center self-stretch border-l border-[var(--color-border)] my-[var(--space-2)] pl-[var(--space-4)]">
                <BreadcrumbTrail steps={trail} onNavigate={onNavigate} />
            </div>
            <span data-id="top-bar-shortcuts-reminder" className="shrink-0 select-none whitespace-nowrap font-[family-name:var(--font-mono)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                {shortcutsOverlayCtrlKeys}: Show hotkeys
            </span>
            <ShortcutTooltip label={shortcutsButtonLabel} shortcut={shortcutsOverlayCtrlKeys} dataId="shortcuts-button-tooltip">
                <IconButton
                    data-id="shortcuts-button"
                    aria-label={shortcutsButtonLabel}
                    size="small"
                    onClick={() => {
                        window.ziggy.runAction(shortcutsOverlayAction).catch(reportShortcutsButtonFailure);
                    }}
                >
                    <FontAwesomeIcon icon={faKeyboard} />
                </IconButton>
            </ShortcutTooltip>
            <ThemeMenu setting={themeSetting} onChooseSetting={onChooseThemeSetting} />
            <LabelTooltip label={rightSidebarLabel} placement="bottom">
                <IconButton data-id="right-sidebar-toggle" aria-label={rightSidebarLabel} size="small" onClick={onToggleRightSidebar}>
                    <FontAwesomeIcon icon={faTableColumns} />
                </IconButton>
            </LabelTooltip>
        </header>
    );
}
