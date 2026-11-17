//
// The right sidebar: the panel at the right of the window that slides in and out.
//

import { JSX, ReactNode } from "react";

//
// Whether the right sidebar is open and what it shows. The layout owns both, because the top
// bar's button opens it and the layout knows which page is open.
//
export interface IRightSidebarProps {
    // Whether the sidebar is slid in.
    isOpen: boolean;

    // What the sidebar's content area shows.
    children: ReactNode;
}

//
// Slides in from the right edge when it opens and back out when it closes, by animating its width
// between its full width and none, so the main content area narrows and widens smoothly beside it.
// The content area shows the children and scrolls when they are taller than the window. It is
// drawn only while the sidebar is open, so a user reaches its content only while they can see it.
//
export function RightSidebar({ isOpen, children }: IRightSidebarProps): JSX.Element {
    return (
        <aside
            data-id="right-sidebar"
            className={`shrink-0 overflow-hidden border-[var(--color-border)] bg-[var(--color-panel)] transition-[width] duration-[var(--duration-normal)] ease-[var(--ease-standard)] ${isOpen ? "w-[320px] border-l" : "w-0"}`}
        >
            {isOpen && (
                <div data-id="right-sidebar-content" className="h-full w-[320px] overflow-y-auto">
                    {children}
                </div>
            )}
        </aside>
    );
}
