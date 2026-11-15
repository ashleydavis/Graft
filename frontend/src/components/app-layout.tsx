//
// The app's layout: the top bar across the window, the left sidebar, the main content area that
// shows the current page, the right sidebar and the keyboard shortcuts overlay over them.
//

import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { JSX, useEffect, useState } from "react";
import type { ITaskEvent } from "ziggy";
import { pageTrail } from "../lib/breadcrumb-trail";
import { addGitCommand, IPageGitCommands, isGitCommandEvent, pageGitCommands } from "../lib/git-commands";
import { GitCommandsPanel } from "./git-commands-panel";
import { LeftSidebar } from "./left-sidebar";
import { RightSidebar } from "./right-sidebar";
import { ShortcutsOverlay } from "./shortcuts-overlay";
import { useThemeSetting } from "./app-theme";
import { TopBar } from "./top-bar";

//
// What the layout is given: the repo Graft reads, which the breadcrumb trail starts with.
//
export interface IAppLayoutProps {
    // The path of the repo Graft reads.
    repoPath: string;
}

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
// breadcrumb trail from the page the router shows, so every page gets its trail without drawing it
// itself. It keeps the Git commands every page has run for as long as the app runs, listening
// whether the right sidebar is open or not, so closing a pane or the sidebar or moving to another
// page loses none, and the right sidebar shows the commands of the page that is open. It holds the
// keyboard shortcuts overlay, so `?` shows it over every page.
//
export function AppLayout({ repoPath }: IAppLayoutProps): JSX.Element {
    const [isLeftSidebarMinimised, toggleLeftSidebar] = useSavedSwitch(leftSidebarMinimisedStateKey, "whether the left sidebar is minimised");
    const [isRightSidebarOpen, toggleRightSidebar] = useSavedSwitch(rightSidebarOpenStateKey, "whether the right sidebar is open");
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useThemeSetting();
    const [gitCommandHistory, setGitCommandHistory] = useState<ReadonlyMap<string, IPageGitCommands>>(new Map());

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

    function openPage(path: string): void {
        navigate({
            to: path,
        }).catch(navigationFailureReporter(path));
    }

    return (
        <div data-id="app-layout" className="flex h-screen flex-col overflow-hidden">
            <TopBar
                isLeftSidebarMinimised={isLeftSidebarMinimised}
                onToggleLeftSidebar={toggleLeftSidebar}
                isRightSidebarOpen={isRightSidebarOpen}
                onToggleRightSidebar={toggleRightSidebar}
                trail={pageTrail(location.pathname, repoPath)}
                onNavigate={openPage}
                themeSetting={theme.setting}
                onChooseThemeSetting={theme.onChooseSetting}
            />
            <div className="flex min-h-0 flex-1">
                <LeftSidebar isMinimised={isLeftSidebarMinimised} />
                <div data-id="main-content" className="min-w-0 flex-1 overflow-auto">
                    <Outlet />
                </div>
                <RightSidebar isOpen={isRightSidebarOpen}>
                    <GitCommandsPanel pageCommands={pageGitCommands(gitCommandHistory, location.pathname)} />
                </RightSidebar>
            </div>
            <ShortcutsOverlay />
        </div>
    );
}

//
// Makes the function that reports that the router could not open the page at the path, which the
// breadcrumb trail asked for, so the failure is seen in the log rather than lost, with what to look
// at.
//
export function navigationFailureReporter(path: string): (error: unknown) => void {
    return error => {
        console.error(`Graft could not open the page at ${path}: ${String(error)}. The page stays as it was, so look at the router's routes for that path.`);
    };
}
