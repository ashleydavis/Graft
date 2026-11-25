//
// The repo details pane: the first column of the repo explorer, with the open repo's name and
// path and the links that open the panes about the repo to its right: Commits and Commit.
//

import { faCodeCommit, faPenToSquare, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { List, ListItemButton } from "@mui/material";
import { JSX } from "react";
import { repoName } from "../../../lib/breadcrumb-trail";
import { CHANGES_LINK, COMMITS_LINK } from "../../../lib/repo-explorer";
import { activePaneClass } from "./active-pane-style";
import { CollapsedStrip } from "./collapse";
import { Fact } from "./commit-info-pane";
import { openRowClass } from "./commit-list";
import { collapseHandler, MaximiseButton, PaneHeader } from "./pane-header";
import { paneWidthClass } from "./pane-width";

//
// What the repo details pane shows and what it reports.
//
export interface IRepoDetailsPaneProps {
    // The path of the open repo.
    repoPath: string;

    // The name of the selected link, which the pane shows as selected, or undefined.
    selectedLink: string | undefined;

    // The name of the link whose pane is open, which the pane marks with a bar at the row's left
    // edge, or undefined.
    openLink: string | undefined;

    // Whether the pane is the repo explorer's active pane, which its border shows.
    isActive: boolean;

    // Whether the pane is maximised, filling the repo explorer, which its maximise button shows.
    isMaximised: boolean;

    // Called when the user clicks the pane's maximise button.
    onToggleMaximise(): void;

    // Whether another pane is maximised, which hides this one. It stays drawn, hidden, so it shows
    // again as it was when the panes are restored.
    isHidden: boolean;

    // Whether the pane is collapsed into a narrow strip, which the pane draws in its place.
    isCollapsed: boolean;

    // Called when the user clicks the collapse button or the strip's restore button.
    onToggleCollapse(): void;

    // Called with the name of the link the user clicks.
    onSelectLink(link: string): void;
}

//
// Shows the repo in a rounded card headed "Repo" and the repo's name: its name and its full path
// as labelled facts, laid out as the commit details pane lays out a commit's facts, then the
// Commits link, which opens the commit pane, and the Changes link, which opens the changes pane.
// The card never shrinks, so the panes that open to its right never hide it, and fills the repo
// explorer while it is maximised. The card's border is in the style guide's active pane colour
// while the pane is active. The header's button maximises the pane and restores it. While it is
// collapsed it draws the strip with "Repo" and the repo's name down it in its place.
//
export function RepoDetailsPane({ repoPath, selectedLink, openLink, isActive, isMaximised, onToggleMaximise, isHidden, isCollapsed, onToggleCollapse, onSelectLink }: IRepoDetailsPaneProps): JSX.Element {
    const name = repoName(repoPath);
    if (isCollapsed && !isHidden) {
        return <CollapsedStrip paneLabel="Repo details" title={`Repo ${name}`} paneDataId="repo-details-pane" isActive={isActive} onRestore={onToggleCollapse} />;
    }
    const title = (
        <span className="flex items-baseline gap-2">
            Repo
            <span className="truncate text-[length:var(--text-sm)] font-[var(--weight-normal)] text-[var(--color-text-muted)]">{name}</span>
        </span>
    );
    let hiddenClass = "flex";
    if (isHidden) {
        hiddenClass = "hidden";
    }
    return (
        <section data-id="repo-details-pane" aria-label="Repo details" className={`${hiddenClass} ${paneWidthClass("w-[360px]", isMaximised)} flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-panel)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activePaneClass(isActive)}`}>
            <PaneHeader title={title} titleDataId="repo-details-heading" collapseDataId="repo-details-pane-collapse" onCollapse={collapseHandler(isMaximised, onToggleCollapse)} action={<MaximiseButton isMaximised={isMaximised} dataId="repo-details-maximise" onToggleMaximise={onToggleMaximise} />} />
            <div className="min-h-0 flex-1 overflow-auto">
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2 border-b border-[var(--color-border)] p-4">
                    <Fact label="Name" dataId="repo-details-name">
                        {name}
                    </Fact>
                    <Fact label="Path" dataId="repo-details-path">
                        <code className="break-all font-[family-name:var(--font-mono)]">{repoPath}</code>
                    </Fact>
                </dl>
                <List data-id="repo-details-links" disablePadding={true} className="px-1 py-2">
                    <LinkRow link={COMMITS_LINK} label="Commits" icon={faCodeCommit} dataId="repo-details-commits" selectedLink={selectedLink} openLink={openLink} onSelectLink={onSelectLink} />
                    <LinkRow link={CHANGES_LINK} label="Changes" icon={faPenToSquare} dataId="repo-details-changes" selectedLink={selectedLink} openLink={openLink} onSelectLink={onSelectLink} />
                </List>
            </div>
        </section>
    );
}

//
// What one link of the repo details pane shows and what it reports.
//
export interface ILinkRowProps {
    // The link's name, as in "commits", which the explorer's state records.
    link: string;

    // The link's text.
    label: string;

    // The icon before the text.
    icon: IconDefinition;

    // The data-id of the row, so a smoke test can click it.
    dataId: string;

    // The name of the selected link, or undefined.
    selectedLink: string | undefined;

    // The name of the link whose pane is open, or undefined.
    openLink: string | undefined;

    // Called with the link's name when the user clicks it.
    onSelectLink(link: string): void;
}

//
// Shows one link as a row with its icon and text. The row is a MaterialUI ListItemButton, as the
// rows of the other panes are, so the keys move to it and open it as they do a commit or a file:
// it shows the selected background while selected and a bar at its left edge while its pane is
// open.
//
export function LinkRow({ link, label, icon, dataId, selectedLink, openLink, onSelectLink }: ILinkRowProps): JSX.Element {
    const isOpen = openLink === link;
    let current: "true" | undefined = undefined;
    if (isOpen) {
        current = "true";
    }
    return (
        <ListItemButton
            component="li"
            data-id={dataId}
            aria-label={label}
            selected={selectedLink === link}
            aria-current={current}
            onClick={() => onSelectLink(link)}
            className={`flex items-center gap-2 px-2 text-[length:var(--text-md)] ${openRowClass(isOpen)}`}
        >
            <span className="flex w-[var(--space-6)] shrink-0 items-center text-[length:var(--icon-md)] text-[var(--color-text-muted)]">
                <FontAwesomeIcon icon={icon} fixedWidth={true} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[var(--color-text)]">{label}</span>
        </ListItemButton>
    );
}
