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
// Lays out every page the same way: the top bar above, then the left sidebar, the page and the
// right sidebar side by side. It owns whether the left sidebar is minimised and whether the right
// sidebar is open, because the top bar's buttons change them and the sidebars show them. The left
// sidebar starts expanded and the right sidebar starts closed. It works out the breadcrumb trail
// from the page the router shows, so every page gets its trail without drawing it itself. It keeps
// the Git commands every page has run for as long as the app runs, listening whether the right
// sidebar is open or not, so closing a pane or the sidebar or moving to another page loses none,
// and the right sidebar shows the commands of the page that is open. It holds the keyboard
// shortcuts overlay, so `?` shows it over every page.
//
export function AppLayout({ repoPath }: IAppLayoutProps): JSX.Element {
    const [isLeftSidebarMinimised, setLeftSidebarMinimised] = useState(false);
    const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);
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
                onToggleLeftSidebar={() => setLeftSidebarMinimised(!isLeftSidebarMinimised)}
                isRightSidebarOpen={isRightSidebarOpen}
                onToggleRightSidebar={() => setRightSidebarOpen(!isRightSidebarOpen)}
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
