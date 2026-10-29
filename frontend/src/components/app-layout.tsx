//
// The app's layout: the top bar across the window, the left sidebar, the main content area that
// shows the current page and the right sidebar.
//

import { Outlet } from "@tanstack/react-router";
import { JSX, useState } from "react";
import { LeftSidebar } from "./left-sidebar";
import { RightSidebar } from "./right-sidebar";
import { TopBar } from "./top-bar";

//
// Lays out every page the same way: the top bar above, then the left sidebar, the page and the
// right sidebar side by side. It owns whether the left sidebar is minimised and whether the right
// sidebar is open, because the top bar's buttons change them and the sidebars show them. The left
// sidebar starts expanded and the right sidebar starts closed.
//
export function AppLayout(): JSX.Element {
    const [isLeftSidebarMinimised, setLeftSidebarMinimised] = useState(false);
    const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);

    return (
        <div data-id="app-layout" className="flex h-screen flex-col overflow-hidden">
            <TopBar
                isLeftSidebarMinimised={isLeftSidebarMinimised}
                onToggleLeftSidebar={() => setLeftSidebarMinimised(!isLeftSidebarMinimised)}
                isRightSidebarOpen={isRightSidebarOpen}
                onToggleRightSidebar={() => setRightSidebarOpen(!isRightSidebarOpen)}
            />
            <div className="flex min-h-0 flex-1">
                <LeftSidebar isMinimised={isLeftSidebarMinimised} />
                <div data-id="main-content" className="min-w-0 flex-1 overflow-auto">
                    <Outlet />
                </div>
                <RightSidebar isOpen={isRightSidebarOpen} />
            </div>
        </div>
    );
}
