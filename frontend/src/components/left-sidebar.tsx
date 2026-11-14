//
// The left sidebar: the menu of Graft's pages down the left of the window, which minimises to a
// strip of icons and expands again.
//

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCircleInfo, faCircleQuestion, faCodeCommit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "@tanstack/react-router";
import { JSX } from "react";

//
// Whether the left sidebar is minimised and whether a repo is open. The layout owns both: the top
// bar's button changes the first and the open repo's context holds the second.
//
export interface ILeftSidebarProps {
    // Whether the sidebar shows only its icons.
    isMinimised: boolean;

    // Whether a repo is open, which shows the link to the commits page.
    isRepoOpen: boolean;
}

//
// What one link of the sidebar shows and where it goes.
//
export interface ISidebarLinkProps {
    // The path of the page the link opens.
    to: string;

    // The link's icon, which is all a minimised sidebar shows of it.
    icon: IconDefinition;

    // The page's name, shown next to the icon while the sidebar is expanded and as its tooltip.
    label: string;

    // The data-id of the link. Its label's data-id adds "-label" to it.
    dataId: string;

    // Whether the sidebar is minimised, which hides the label.
    isMinimised: boolean;
}

//
// Links to one page with its icon and, while the sidebar is expanded, its name. The link to the
// page being shown is highlighted. Only an exact match counts, because every path starts with the
// welcome page's "/".
//
export function SidebarLink({ to, icon, label, dataId, isMinimised }: ISidebarLinkProps): JSX.Element {
    return (
        <Link
            to={to}
            data-id={dataId}
            aria-label={label}
            title={label}
            activeOptions={{
                exact: true,
            }}
            activeProps={{
                className: "bg-[var(--color-selected)] text-[var(--color-text)] shadow-[inset_2px_0_0_var(--color-select-item)] hover:bg-[var(--color-selected)]",
            }}
            className={`mx-2 flex h-9 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-[length:var(--text-md)] font-[var(--weight-medium)] text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] ${isMinimised ? "justify-center" : "justify-start"}`}
        >
            <FontAwesomeIcon icon={icon} fixedWidth={true} className="text-[length:var(--icon-md)]" />
            {!isMinimised && <span data-id={`${dataId}-label`} className="truncate">{label}</span>}
        </Link>
    );
}

//
// Shows the links to Graft's pages: Commits at the top with the pages about the repo. Help and
// About sit at the bottom, apart from them, because they are about the app itself. The Commits link
// shows only while a repo is open, so the commit explorer is reached by opening a repo. Expanded,
// each link shows its icon and name. Minimised, the sidebar narrows to a strip of icons, which
// leaves more of the window to the page while every link stays one click away.
//
export function LeftSidebar({ isMinimised, isRepoOpen }: ILeftSidebarProps): JSX.Element {
    return (
        <aside
            data-id="left-sidebar"
            className={`flex shrink-0 flex-col justify-between gap-1 overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-panel)] py-2 transition-[width] duration-[var(--duration-normal)] ease-[var(--ease-standard)] ${isMinimised ? "w-16" : "w-60"}`}
        >
            <nav>
                {isRepoOpen && (
                    <SidebarLink to="/commits" icon={faCodeCommit} label="Commits" dataId="left-sidebar-commits-link" isMinimised={isMinimised} />
                )}
            </nav>
            <nav>
                <SidebarLink to="/help" icon={faCircleQuestion} label="Help" dataId="left-sidebar-help-link" isMinimised={isMinimised} />
                <SidebarLink to="/about" icon={faCircleInfo} label="About" dataId="left-sidebar-about-link" isMinimised={isMinimised} />
            </nav>
        </aside>
    );
}
