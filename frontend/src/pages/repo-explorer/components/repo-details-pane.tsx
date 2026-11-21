//
// The repo details pane: the first column of the repo explorer, with the open repo's name and
// path and the links that open the panes about the repo to its right, Commits among them.
//

import { faCodeCommit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { List, ListItemButton } from "@mui/material";
import { JSX } from "react";
import { repoName } from "../../../lib/breadcrumb-trail";
import { COMMITS_LINK } from "../../../lib/repo-explorer";
import { activePaneClass } from "./active-pane-style";
import { Fact } from "./commit-details-pane";
import { openRowClass } from "./commit-list";
import { PaneHeader } from "./pane-header";

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

    // Called with the name of the link the user clicks.
    onSelectLink(link: string): void;
}

//
// Shows the repo in a rounded card headed "Repo" and the repo's name: its name and its full path
// as labelled facts, laid out as the commit details pane lays out a commit's facts, then the
// Commits link. The card never shrinks, so the panes that open to its right never hide it. The
// link is a MaterialUI ListItemButton, as the rows of the other panes are, so the keys move to it
// and open it as they do a commit or a file. The card's border is in the style guide's active pane
// colour while the pane is active.
//
export function RepoDetailsPane({ repoPath, selectedLink, openLink, isActive, onSelectLink }: IRepoDetailsPaneProps): JSX.Element {
    const name = repoName(repoPath);
    const isCommitsOpen = openLink === COMMITS_LINK;
    let commitsCurrent: "true" | undefined = undefined;
    if (isCommitsOpen) {
        commitsCurrent = "true";
    }
    const title = (
        <span className="flex items-baseline gap-2">
            Repo
            <span className="truncate text-[length:var(--text-sm)] font-[var(--weight-normal)] text-[var(--color-text-muted)]">{name}</span>
        </span>
    );
    return (
        <section data-id="repo-details-pane" aria-label="Repo details" className={`flex w-[360px] flex-none flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-panel)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activePaneClass(isActive)}`}>
            <PaneHeader title={title} titleDataId="repo-details-heading" action={undefined} />
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
                    <ListItemButton
                        component="li"
                        data-id="repo-details-commits"
                        aria-label="Commits"
                        selected={selectedLink === COMMITS_LINK}
                        aria-current={commitsCurrent}
                        onClick={() => onSelectLink(COMMITS_LINK)}
                        className={`flex items-center gap-2 px-2 text-[length:var(--text-md)] ${openRowClass(isCommitsOpen)}`}
                    >
                        <span className="flex w-[var(--space-6)] shrink-0 items-center text-[length:var(--icon-md)] text-[var(--color-text-muted)]">
                            <FontAwesomeIcon icon={faCodeCommit} fixedWidth={true} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[var(--color-text)]">Commits</span>
                    </ListItemButton>
                </List>
            </div>
        </section>
    );
}
