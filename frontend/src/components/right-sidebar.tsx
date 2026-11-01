//
// The right sidebar: the panel at the right of the window that slides in and out.
//

import { JSX } from "react";

//
// Whether the right sidebar is open. The layout owns it, because the top bar's button changes it.
//
export interface IRightSidebarProps {
    // Whether the sidebar is slid in.
    isOpen: boolean;
}

//
// Slides in from the right edge when it opens and back out when it closes, by animating its width
// between its full width and none, so the main content area narrows and widens smoothly beside it.
// Its content area is empty, ready for the features that show in it. The content area is drawn
// only while the sidebar is open, so a user reaches its content only while they can see it.
//
export function RightSidebar({ isOpen }: IRightSidebarProps): JSX.Element {
    return (
        <aside
            data-id="right-sidebar"
            className={`shrink-0 overflow-hidden border-gray-200 transition-[width] duration-200 ${isOpen ? "w-[340px] border-l" : "w-0"}`}
        >
            {isOpen && <div data-id="right-sidebar-content" className="h-full w-[340px]" />}
        </aside>
    );
}
