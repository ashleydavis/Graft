//
// The repo details pane: the first column of the repo explorer, with the open repo's name and
// path, the links that open the panes about the repo to its right, Commits and Changes, the repo's
// local branches, each of which opens its branch pane to the right, and one link for each of the
// repo's tags.
//

import { faCodeBranch, faCodeCommit, faPenToSquare, faTag, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Chip, List, ListItemButton } from "@mui/material";
import { JSX } from "react";
import { IBranch } from "../../../lib/branches";
import { repoName } from "../../../lib/breadcrumb-trail";
import { paneWidthStyle } from "../../../lib/pane-widths";
import { branchLink, CHANGES_LINK, COMMITS_LINK, tagLink } from "../../../lib/repo-explorer";
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

    // The repo's local branches in the order of their names, or undefined while they are read.
    branches: IBranch[] | undefined;

    // Why the branches could not be read, or undefined.
    branchesError: string | undefined;

    // The name of the selected row, a link or a branch as branchLink names it, which the pane shows
    // as selected, or undefined.
    selectedLink: string | undefined;

    // The name of the row whose pane is open, which the pane marks with a bar at the row's left
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

    // The names of the repo's tags, in the order the pane lists them, or undefined until they are
    // read.
    tagNames: string[] | undefined;

    // Why the tags could not be read, or undefined.
    tagsError: string | undefined;

    // Called with the name of the row the user clicks, a link, a branch or a tag as branchLink and
    // tagLink name them.
    onSelectLink(link: string): void;

    // The width its resize handle set, in pixels, or undefined for its usual width.
    width: number | undefined;
}

//
// Shows the repo in a rounded card headed "Repo" and the repo's name: its name and its full path as
// labelled facts, laid out as the commit details pane lays out a commit's facts, then the Commits
// link, which opens the commit pane, and the Changes link, which opens the changes pane, then the
// Branches list, each branch opening its branch pane, then a "Tags" heading with a row for each
// tag, which opens the tag pane, as the style guide's sidebar lays out its Tags group: the tag icon
// and the tag's name. A repo with no tags shows the heading alone, and tags that could not be read
// show why under it. The card never shrinks, so the panes that open to its right never hide it, and
// fills the repo explorer while it is maximised. It is 360 pixels wide, or the width its resize
// handle set. The card's border is in the style guide's active pane colour while the pane is
// active. The header's button maximises the pane and restores it. While it is collapsed it draws
// the strip with "Repo" and the repo's name down it in its place.
//
export function RepoDetailsPane({ repoPath, branches, branchesError, selectedLink, openLink, isActive, isMaximised, onToggleMaximise, isHidden, isCollapsed, onToggleCollapse, tagNames, tagsError, onSelectLink, width }: IRepoDetailsPaneProps): JSX.Element {
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
        <section data-id="repo-details-pane" aria-label="Repo details" style={paneWidthStyle(width)} className={`${hiddenClass} ${paneWidthClass("w-[360px]", isMaximised)} flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-panel)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activePaneClass(isActive)}`}>
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
                <BranchList branches={branches} error={branchesError} selectedLink={selectedLink} openLink={openLink} onSelectLink={onSelectLink} />
                <p data-id="repo-details-tags-heading" className="border-t border-[var(--color-border)] px-4 pt-3 pb-2 text-[length:var(--text-sm)] font-[var(--weight-bold)] leading-[var(--leading-normal)] text-[var(--color-text-muted)]">Tags</p>
                {tagsError !== undefined && (
                    <p data-id="repo-details-tags-error" className="mx-3 mb-2 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[length:var(--text-sm)] text-[var(--color-text)]">{tagsError}</p>
                )}
                <List data-id="repo-details-tags" disablePadding={true} className="px-1 pb-2">
                    {(tagNames ?? []).map(tagName => (
                        <LinkRow key={tagName} link={tagLink(tagName)} label={tagName} icon={faTag} dataId={`repo-details-tag-${tagName}`} selectedLink={selectedLink} openLink={openLink} onSelectLink={onSelectLink} />
                    ))}
                </List>
            </div>
        </section>
    );
}

//
// What the repo details pane's Branches list shows and what it reports.
//
export interface IBranchListProps {
    // The repo's local branches, or undefined while they are read.
    branches: IBranch[] | undefined;

    // Why the branches could not be read, or undefined.
    error: string | undefined;

    // The name of the selected row, or undefined.
    selectedLink: string | undefined;

    // The name of the row whose pane is open, or undefined.
    openLink: string | undefined;

    // Called with the branch's row name, as branchLink names it, when the user clicks a branch.
    onSelectLink(link: string): void;
}

//
// Shows the "Branches" heading with the number of branches beside it, as the style guide's sidebar
// heads its Branches group, then one row per branch. While the branches are read it shows that they
// are loading, and when they could not be read it shows why. A repo with no commits has no
// branches, so it shows the heading with a count of 0 and no rows.
//
export function BranchList({ branches, error, selectedLink, openLink, onSelectLink }: IBranchListProps): JSX.Element {
    return (
        <section data-id="repo-details-branches" aria-label="Branches" className="border-t border-[var(--color-border)] px-1 py-2">
            <div className="flex items-center gap-2 px-2 py-1">
                <h3 data-id="repo-details-branches-heading" className="min-w-0 flex-1 truncate text-[length:var(--text-sm)] font-[var(--weight-bold)] text-[var(--color-text-muted)]">Branches</h3>
                {branches && <Chip variant="count" data-id="repo-details-branches-count" label={branches.length} component="span" />}
            </div>
            {error !== undefined && (
                <p data-id="repo-details-branches-error" className="m-2 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[length:var(--text-sm)] text-[var(--color-text)]">{error}</p>
            )}
            {error === undefined && !branches && (
                <p data-id="repo-details-branches-loading" className="px-2 py-1 text-[length:var(--text-sm)] text-[var(--color-text-muted)]">Loading the branches.</p>
            )}
            {branches && (
                <List data-id="repo-details-branch-list" aria-label="Branches" disablePadding={true}>
                    {branches.map(branch => <BranchRow key={branch.name} branch={branch} selectedLink={selectedLink} openLink={openLink} onSelectLink={onSelectLink} />)}
                </List>
            )}
        </section>
    );
}

//
// What one branch's row shows and what it reports.
//
export interface IBranchRowProps {
    // The branch the row shows.
    branch: IBranch;

    // The name of the selected row, or undefined.
    selectedLink: string | undefined;

    // The name of the row whose pane is open, or undefined.
    openLink: string | undefined;

    // Called with the branch's row name, as branchLink names it, when the user clicks the row.
    onSelectLink(link: string): void;
}

//
// Shows one branch as a row with the branch icon and the branch's name in the monospace font, as
// the style guide's sidebar lists a branch. It is a MaterialUI ListItemButton, as the links are,
// so the keys move to it and open it as they do a link: it shows the selected background while
// selected and a bar at its left edge while its pane is open. The checked-out branch has a HEAD
// badge after its name in the colour of the commit list's checked-out branch badge.
//
export function BranchRow({ branch, selectedLink, openLink, onSelectLink }: IBranchRowProps): JSX.Element {
    const link = branchLink(branch.name);
    const isOpen = openLink === link;
    let current: "true" | undefined = undefined;
    if (isOpen) {
        current = "true";
    }
    return (
        <ListItemButton
            component="li"
            data-id={`repo-details-branch-${branch.name}`}
            aria-label={branch.name}
            selected={selectedLink === link}
            aria-current={current}
            onClick={() => onSelectLink(link)}
            className={`flex items-center gap-2 px-2 ${openRowClass(isOpen)}`}
        >
            <span className="flex w-[var(--space-6)] shrink-0 items-center text-[length:var(--icon-md)] text-[var(--color-text-muted)]">
                <FontAwesomeIcon icon={faCodeBranch} fixedWidth={true} />
            </span>
            <span className="min-w-0 flex-1 truncate font-[family-name:var(--font-mono)] text-[length:var(--text-sm)] text-[var(--color-text)]">{branch.name}</span>
            {branch.isCheckedOut && <Chip variant="current" size="small" data-id="repo-details-branch-checked-out" label="HEAD" component="span" />}
        </ListItemButton>
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
