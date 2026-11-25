//
// The app's layout: the top bar across the window, the left sidebar, the main content area that
// shows the current page, the right sidebar and the keyboard shortcuts overlay and the command
// palette over them.
//

import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { JSX, useEffect, useState } from "react";
import type { ITaskEvent } from "ziggy";
import { PaneOrPage, selectedPaneOrPage } from "../lib/active-pane";
import { ITrailStep, pageTrail } from "../lib/breadcrumb-trail";
import { viewHelp } from "../lib/context-help";
import { addGitCommand, IPageGitCommands, isGitCommandEvent, selectedGitCommands } from "../lib/git-commands";
import { openPage } from "../lib/navigation";
import { ActivePaneContext } from "./active-pane";
import { CommandPalette } from "./command-palette";
import { useRepoExplorerAction } from "./repo-explorer-action";
import { GitCommandsPanel } from "./git-commands-panel";
import { HelpPane } from "./help-pane";
import { LeftSidebar } from "./left-sidebar";
import { useNewWindowAction } from "./new-window-action";
import { useOpenRepoAction } from "./open-repo-action";
import { PaneTrailContext } from "./pane-trail";
import { usePageZoom } from "./page-zoom";
import { useRepo } from "./repo-context";
import { RightSidebar } from "./right-sidebar";
import { ShortcutsOverlay } from "./shortcuts-overlay";
import { useThemeSetting } from "./app-theme";
import { TopBar } from "./top-bar";

//
// The key path in Graft's state file of whether the left sidebar is minimised. The layout reads it
// as Graft starts and writes it each time the top bar's menu button is clicked. Both sidebars' keys
// sit under `sidebar`, so the state file keeps them together.
//
export const leftSidebarMinimisedStateKey = "sidebar.left.minimised";

//
// The key path in Graft's state file of whether the right sidebar is open. The layout reads it as
// Graft starts and writes it each time the top bar's right sidebar button is clicked. It sits under
// `sidebar` beside the left sidebar's key, so the state file keeps them together.
//
export const rightSidebarOpenStateKey = "sidebar.right.open";

//
// Keeps a switch that is off until Graft's state file holds true for it, with the function that
// flips it. It reads the switch from the state key through window.ziggy when the layout first
// draws, and each flip writes the new value there, so the next run of Graft starts with it. Only
// true turns the switch on, so a missing or unreadable value leaves it off. A failed read or write
// is logged with what the switch is, given in the description, and the switch keeps working until
// Graft closes.
//
export function useSavedSwitch(stateKey: string, description: string): [boolean, () => void] {
    const [isOn, setOn] = useState(false);
    useEffect(() => {
        window.ziggy.getState(stateKey)
            .then(value => {
                setOn(value === true);
            })
            .catch(error => {
                console.error(`Graft could not read ${description} from its state file at ${stateKey}: ${String(error)}. Graft starts with the default until it is changed.`);
            });
    }, [stateKey, description]);

    function toggle(): void {
        const next = !isOn;
        setOn(next);
        window.ziggy.setState(stateKey, next).catch(error => {
            console.error(`Graft could not save ${description} in its state file at ${stateKey}: ${String(error)}. The sidebar stays as it is until Graft closes, and the next run starts as the file holds.`);
        });
    }

    return [isOn, toggle];
}

//
// Lays out every page the same way: the top bar above, then the left sidebar, the page and the
// right sidebar side by side. It owns whether the left sidebar is minimised and whether the right
// sidebar is open, because the top bar's buttons change them and the sidebars show them. Both are
// kept in Graft's state file, so Graft starts with the sidebars as they were left. With nothing
// saved, the left sidebar starts expanded and the right sidebar starts closed. It works out the
// breadcrumb trail from the page the router shows, the open repo and the pane steps the page sets
// through PaneTrailContext, so every page gets its trail without drawing it itself. It keeps the
// Git commands every page has run for as long as the app runs, listening whether the right sidebar
// is open or not, so closing a pane or the sidebar or moving to another page loses none, and the
// right sidebar shows the commands of the active pane, or of the page that is open while the page
// has no active pane. It holds the keyboard shortcuts
// overlay, so `?` shows it over every page, and the command palette, so Ctrl+Shift+P shows it over
// every page. It keeps the active pane the page sets through ActivePaneContext and works out the
// selected pane or page from it and the page the router shows, so the command palette lists that
// pane or page's commands first and the right sidebar's Help pane shows its help under the Git
// commands panel. It calls the hook of each feature whose action works on every page, one line per
// feature, because the layout is inside both the router and the open repo's context for as long as
// the window is open.
//
export function AppLayout(): JSX.Element {
    const [isLeftSidebarMinimised, toggleLeftSidebar] = useSavedSwitch(leftSidebarMinimisedStateKey, "whether the left sidebar is minimised");
    const [isRightSidebarOpen, toggleRightSidebar] = useSavedSwitch(rightSidebarOpenStateKey, "whether the right sidebar is open");
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useThemeSetting();
    const { repoPath } = useRepo();
    const [gitCommandHistory, setGitCommandHistory] = useState<ReadonlyMap<string, IPageGitCommands>>(new Map());
    const [paneSteps, setPaneSteps] = useState<ITrailStep[]>([]);
    const [activePane, setActivePane] = useState<PaneOrPage | undefined>(undefined);
    usePageZoom();
    useOpenRepoAction();
    useRepoExplorerAction();
    useNewWindowAction();

    useEffect(() => {
        function onTaskEvent(event: ITaskEvent<unknown>): void {
            const data = event.data;
            if (isGitCommandEvent(data)) {
                setGitCommandHistory(history => addGitCommand(history, event.source, data));
            }
        }

        window.ziggy.onTaskEvent(onTaskEvent);
        return () => window.ziggy.removeTaskEventListener(onTaskEvent);
    }, []);

    return (
        <div data-id="app-layout" className="flex h-screen flex-col overflow-hidden">
            <TopBar
                isLeftSidebarMinimised={isLeftSidebarMinimised}
                onToggleLeftSidebar={toggleLeftSidebar}
                isRightSidebarOpen={isRightSidebarOpen}
                onToggleRightSidebar={toggleRightSidebar}
                trail={pageTrail(location.pathname, repoPath, paneSteps)}
                onNavigate={path => openPage(navigate, path)}
                themeSetting={theme.setting}
                onChooseThemeSetting={theme.onChooseSetting}
            />
            <div className="flex min-h-0 flex-1">
                <LeftSidebar isMinimised={isLeftSidebarMinimised} isRepoOpen={Boolean(repoPath)} />
                <div data-id="main-content" className="@container min-w-0 flex-1 overflow-auto">
                    <PaneTrailContext.Provider value={{
                        setPaneSteps,
                    }}>
                        <ActivePaneContext.Provider value={{
                            setActivePane,
                        }}>
                            <Outlet />
                        </ActivePaneContext.Provider>
                    </PaneTrailContext.Provider>
                </div>
                <RightSidebar isOpen={isRightSidebarOpen}>
                    <GitCommandsPanel commands={selectedGitCommands(gitCommandHistory, location.pathname, activePane)} isPane={activePane !== undefined} />
                    <HelpPane help={viewHelp(selectedPaneOrPage(location.pathname, activePane))} />
                </RightSidebar>
            </div>
            <ShortcutsOverlay />
            <CommandPalette paneOrPage={selectedPaneOrPage(location.pathname, activePane)} />
        </div>
    );
}
