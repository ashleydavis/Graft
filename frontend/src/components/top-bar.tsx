//
// The top bar: the bar across the top of the window with Graft's name, the breadcrumb trail and the
// buttons that minimise and expand the left sidebar and slide the right sidebar in and out.
//

import { faBars, faTableColumns } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton } from "@mui/material";
import { JSX } from "react";
import { ITrailStep } from "../lib/breadcrumb-trail";
import { BreadcrumbTrail } from "./breadcrumb-trail";

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
}

//
// Shows the menu button that minimises and expands the left sidebar at the left, Graft's name next
// to it and the button that slides the right sidebar in and out at the right, so each button sits
// on the side of the sidebar it moves. Each button's label and tooltip say what a click does next.
// The breadcrumb trail takes the free space between them, set off by a divider, so it says where
// the user is without moving the buttons.
//
export function TopBar({ isLeftSidebarMinimised, onToggleLeftSidebar, isRightSidebarOpen, onToggleRightSidebar, trail, onNavigate }: ITopBarProps): JSX.Element {
    const leftSidebarLabel = isLeftSidebarMinimised ? "Expand the left sidebar" : "Minimise the left sidebar";
    const rightSidebarLabel = isRightSidebarOpen ? "Close the right sidebar" : "Open the right sidebar";

    return (
        <header data-id="top-bar" className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 px-2">
            <IconButton data-id="left-sidebar-toggle" aria-label={leftSidebarLabel} title={leftSidebarLabel} onClick={onToggleLeftSidebar}>
                <FontAwesomeIcon icon={faBars} />
            </IconButton>
            <span data-id="top-bar-name" className="font-extrabold tracking-wide select-none">
                Graft
            </span>
            <div data-id="top-bar-trail" className="mx-4 flex min-w-0 flex-1 items-center border-l border-gray-200 pl-4">
                <BreadcrumbTrail steps={trail} onNavigate={onNavigate} />
            </div>
            <IconButton data-id="right-sidebar-toggle" aria-label={rightSidebarLabel} title={rightSidebarLabel} onClick={onToggleRightSidebar}>
                <FontAwesomeIcon icon={faTableColumns} />
            </IconButton>
        </header>
    );
}
