//
// The app's layout: the top bar across the window, the left sidebar, the main content area that
// shows the current page and the right sidebar.
//

import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { JSX, useEffect, useState } from "react";
import { pageTrail } from "../lib/breadcrumb-trail";
import { openPickedRepo, openRepoActionName } from "../lib/open-repo";
import { LeftSidebar } from "./left-sidebar";
import { useRepo } from "./repo-context";
import { RightSidebar } from "./right-sidebar";
import { useThemeSetting } from "./app-theme";
import { TopBar } from "./top-bar";

//
// Lays out every page the same way: the top bar above, then the left sidebar, the page and the
// right sidebar side by side. It owns whether the left sidebar is minimised and whether the right
// sidebar is open, because the top bar's buttons change them and the sidebars show them. The left
// sidebar starts expanded and the right sidebar starts closed. It works out the breadcrumb trail
// from the page the router shows and the open repo, so every page gets its trail without drawing it
// itself. It registers the handler of the open-repo action, which opens the folder the user picks
// and shows it in the commit explorer, because the layout is inside both the router and the open
// repo's context for as long as the window is open.
//
export function AppLayout(): JSX.Element {
    const [isLeftSidebarMinimised, setLeftSidebarMinimised] = useState(false);
    const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useThemeSetting();
    const { repoPath, openRepo } = useRepo();

    function openPage(path: string): void {
        navigate({
            to: path,
        }).catch(navigationFailureReporter(path));
    }

    //
    // The handler is registered once. openRepo and openPage only call the provider's state setter
    // and the router's navigate, which stay the same for as long as the layout is shown, so the
    // first render's handler stays current.
    //
    useEffect(() => {
        window.ziggy.registerAction(openRepoActionName, () => openPickedRepo(pickedRepoPath => {
            openRepo(pickedRepoPath);
            openPage("/commits");
        }));
        return () => {
            window.ziggy.removeAction(openRepoActionName);
        };
    }, []);

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
                <LeftSidebar isMinimised={isLeftSidebarMinimised} isRepoOpen={repoPath !== undefined} />
                <div data-id="main-content" className="min-w-0 flex-1 overflow-auto">
                    <Outlet />
                </div>
                <RightSidebar isOpen={isRightSidebarOpen} />
            </div>
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
