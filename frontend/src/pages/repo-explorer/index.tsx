//
// The repo explorer page: shows the open repo in the repo details pane. Clicking its Commits link
// opens the commit pane to its right with the first page of the repo's commits, clicking a commit
// opens the commit details pane to its right and clicking a changed file there opens the file pane
// to its right, like the column view of a file browser. Its Commit link opens the changes pane in
// place of the commit pane, with the working tree's unstaged and staged files, and clicking a file
// there opens its file pane. The arrow keys, Enter and Escape move through the panes as in the
// column view of macOS Finder.
//

import { Link } from "@tanstack/react-router";
import { JSX, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRepo } from "../../components/repo-context";
import { ICommit, readCommitPage } from "../../lib/commits";
import { changeKey, changeKeysOf, closeChangeFilePane, closeCommitDetailsPane, closeFilePane, COMMIT_LINK, COMMITS_LINK, explorerStateAfterKey, findChange, followMovedChange, initialRepoExplorerState, IRepoExplorerState, isExplorerKey, isExplorerKeyTarget, keepListedChanges, selectChange, selectCommit, selectFile, selectLink } from "../../lib/repo-explorer";
import { toggleFileStaged } from "../../lib/stage-file";
import { IWorkingChanges, IWorkingFile, readWorkingChanges } from "../../lib/working-changes";
import { ChangesPane } from "./components/changes-pane";
import { CommitDetailsPane } from "./components/commit-details-pane";
import { CommitPane } from "./components/commit-pane";
import { FilePane } from "./components/file-pane";
import { RepoDetailsPane } from "./components/repo-details-pane";
import { WorkingFilePane } from "./components/working-file-pane";

//
// The most commits the commit pane lists. It lists the first page only, and this many fills a
// window with room to spare.
//
const COMMIT_PAGE_SIZE = 50;

//
// What the repo explorer is given: the repo to show.
//
export interface IRepoExplorerProps {
    // The repo to show.
    repoPath: string;
}

//
// Shows the repo explorer of the open repo. Opening another repo shows its explorer afresh, with
// only the repo details pane open, because the explorer is keyed by the repo's path. While no repo
// is open it shows that no repo is open, because the repo explorer has no repo to show.
//
export function RepoExplorerPage(): JSX.Element {
    const { repoPath } = useRepo();
    if (!repoPath) {
        return (
            <main data-id="repo-explorer-page" className="graft-page-in flex flex-col gap-4 p-6">
                <h1 data-id="repo-explorer-heading" className="text-[length:var(--text-2xl)] font-[var(--weight-bold)] text-[var(--color-text)]">Repo explorer</h1>
                <p data-id="repo-explorer-no-repo" className="text-[var(--color-text-muted)]">No repo is open. Choose File, then Open repo, to open one.</p>
            </main>
        );
    }
    return <RepoExplorer key={repoPath} repoPath={repoPath} />;
}

//
// Shows the repo details pane, then the panes the user opens from it, with a link back to the
// About page. It reads the first page of the repo's commits, newest first, when the Commits link
// opens the commit pane, and reads them afresh each time the pane opens. The commit pane shows that
// it is loading until the commits task ends, and what went wrong when the commits could not be
// read. It owns the repo explorer's state (lib/repo-explorer.ts): which pane is active, which link,
// commit and file are selected and which are open, because each pane opens the next: a newly
// clicked commit closes the file pane and closing a pane closes the panes to its right. Dates are
// shown in the browser's own locale and time zone. When a pane opens, the page scrolls sideways to
// bring it into view, because the newest pane is the one the user wants to read and it can open
// beyond the right edge of the window. While the page is shown it handles the arrow keys, Enter
// and Escape itself, on the document in the capture phase, so the key reaches it before a focused
// row's own Enter handling and the page does not also scroll. It leaves the keys to a text box,
// link, button, menu or dialog that has the focus. It takes the focus when it opens, so the keys
// work at once after the left sidebar's link or Ctrl+1 opened it, while the focus would otherwise
// stay on the link outside the page. It takes the focus and sets up the key listener with the items
// just drawn as React draws them (in layout effects), before the browser paints, so a key pressed
// as soon as the page or its items show acts on them. It reads the working tree's changes when the
// Commit link opens the changes pane and again after each stage and unstage, so the lists show
// what git holds. The changed file's pane is keyed by the number of reads, so its diff is read
// afresh with the lists.
//
export function RepoExplorer({ repoPath }: IRepoExplorerProps): JSX.Element {
    const [commits, setCommits] = useState<ICommit[] | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);
    const [explorer, setExplorer] = useState(initialRepoExplorerState);
    const [filePaths, setFilePaths] = useState<string[]>([]);
    const [changes, setChanges] = useState<IWorkingChanges | undefined>(undefined);
    const [changesError, setChangesError] = useState<string | undefined>(undefined);
    const [stageError, setStageError] = useState<string | undefined>(undefined);
    const [changesReadCount, setChangesReadCount] = useState(0);
    const pageRef = useRef<HTMLElement>(null);
    const columnsRef = useRef<HTMLDivElement>(null);
    const dateFormat = Intl.DateTimeFormat().resolvedOptions();
    const isCommitsOpen = explorer.openLink === COMMITS_LINK;
    const isChangesOpen = explorer.openLink === COMMIT_LINK;

    //
    // Reads the working tree's changes and shows them, then works out the explorer's state from
    // them with stateAfterRead, so a moved file's row is followed and a row that has gone is
    // dropped in the same step that draws the new lists.
    //
    function readChanges(stateAfterRead: (state: IRepoExplorerState) => IRepoExplorerState): void {
        readWorkingChanges({
            taskId: `working-changes-${Date.now()}-${Math.random()}`,
            repoPath,
        }, result => {
            if (!result.ok) {
                setChangesError(result.error.message);
                return;
            }
            setChanges(result.value);
            setChangesReadCount(count => count + 1);
            setExplorer(state => keepListedChanges(stateAfterRead(state), changeKeysOf(result.value)));
        });
    }

    //
    // Stages a file in the unstaged list or unstages a file in the staged list, then reads the
    // changes again with the file's selection and open pane following it to the other list. When
    // git refuses, the changes pane shows why.
    //
    function onToggleStaged(file: IWorkingFile, isStaged: boolean): void {
        toggleFileStaged({
            taskId: `stage-file-${Date.now()}-${Math.random()}`,
            repoPath,
            path: file.path,
            isStaged,
        }, result => {
            if (!result.ok) {
                setStageError(result.error.message);
                return;
            }
            setStageError(undefined);
            readChanges(state => followMovedChange(state, changeKey(isStaged, file.path), changeKey(!isStaged, file.path)));
        });
    }

    useEffect(() => {
        setChanges(undefined);
        setChangesError(undefined);
        setStageError(undefined);
        if (!isChangesOpen) {
            return;
        }
        readChanges(state => state);
    }, [repoPath, isChangesOpen]);

    useEffect(() => {
        setCommits(undefined);
        setError(undefined);
        if (!isCommitsOpen) {
            return;
        }
        readCommitPage({
            taskId: `commits-${Date.now()}-${Math.random()}`,
            repoPath,
            pageSize: COMMIT_PAGE_SIZE,
        }, result => {
            if (result.ok) {
                setCommits(result.value);
            }
            else {
                setError(result.error.message);
            }
        });
    }, [repoPath, isCommitsOpen]);

    useLayoutEffect(() => {
        pageRef.current?.focus({
            preventScroll: true,
        });
    }, []);

    useEffect(() => {
        setFilePaths([]);
    }, [explorer.openHash]);

    useEffect(() => {
        if (explorer.openLink) {
            scrollLastPaneIntoView(columnsRef.current);
        }
    }, [explorer.openLink, explorer.openHash, explorer.openPath, explorer.openChange]);

    useLayoutEffect(() => {
        const items = {
            links: [COMMITS_LINK, COMMIT_LINK],
            commitHashes: (commits ?? []).map(commit => commit.hash),
            filePaths,
            changeKeys: changeKeysOf(changes),
        };

        function onKeyDown(event: KeyboardEvent): void {
            if (!isExplorerKey(event.key)) {
                return;
            }
            const hasModifier = event.ctrlKey || event.altKey || event.metaKey;
            if (!isExplorerKeyTarget(event.target, pageRef.current, hasModifier)) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            setExplorer(state => explorerStateAfterKey(state, event.key, items));
        }

        document.addEventListener("keydown", onKeyDown, {
            capture: true,
        });
        return () => document.removeEventListener("keydown", onKeyDown, {
            capture: true,
        });
    }, [commits, filePaths, changes]);

    const openChange = findChange(changes, explorer.openChange);

    return (
        <main ref={pageRef} tabIndex={-1} data-id="repo-explorer-page" className="graft-page-in outline-none flex h-full w-max min-w-full flex-col gap-4 bg-[var(--color-bg)] p-6">
            <div className="flex items-baseline gap-4">
                <h1 data-id="repo-explorer-heading" className="text-[length:var(--text-2xl)] font-[var(--weight-bold)] text-[var(--color-text)]">Repo explorer</h1>
                <Link to="/about" data-id="repo-explorer-about-link" className="text-[length:var(--text-md)] text-[var(--color-accent)] underline-offset-2 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:text-[var(--color-accent-hover)] hover:underline">About</Link>
            </div>
            <div ref={columnsRef} data-id="repo-explorer-columns" className="flex min-h-0 flex-1 items-stretch gap-3">
                <RepoDetailsPane repoPath={repoPath} selectedLink={explorer.selectedLink} openLink={explorer.openLink} isActive={explorer.activePaneIndex === 0} onSelectLink={link => setExplorer(selectLink(link))} />
                {isCommitsOpen && (
                    <CommitPane commits={commits} error={error} selectedHash={explorer.selectedHash} openHash={explorer.openHash} isActive={explorer.activePaneIndex === 1} dateFormat={dateFormat} onSelectCommit={hash => setExplorer(state => selectCommit(state, hash))} />
                )}
                {explorer.openHash !== undefined && (
                    <CommitDetailsPane
                        key={explorer.openHash}
                        repoPath={repoPath}
                        hash={explorer.openHash}
                        selectedPath={explorer.selectedPath}
                        openPath={explorer.openPath}
                        isActive={explorer.activePaneIndex === 2}
                        dateFormat={dateFormat}
                        onSelectFile={path => setExplorer(state => selectFile(state, path))}
                        onReadFiles={setFilePaths}
                        onClose={() => setExplorer(closeCommitDetailsPane)}
                    />
                )}
                {explorer.openHash !== undefined && explorer.openPath !== undefined && (
                    <FilePane key={`${explorer.openHash} ${explorer.openPath}`} repoPath={repoPath} hash={explorer.openHash} path={explorer.openPath} isActive={explorer.activePaneIndex === 3} onClose={() => setExplorer(closeFilePane)} />
                )}
                {isChangesOpen && (
                    <ChangesPane
                        changes={changes}
                        error={changesError}
                        stageError={stageError}
                        selectedKey={explorer.selectedChange}
                        openKey={explorer.openChange}
                        isActive={explorer.activePaneIndex === 1}
                        onSelectChange={key => setExplorer(state => selectChange(state, key))}
                        onToggleStaged={onToggleStaged}
                    />
                )}
                {isChangesOpen && openChange && (
                    <WorkingFilePane key={`${explorer.openChange} ${changesReadCount}`} repoPath={repoPath} file={openChange.file} isStaged={openChange.isStaged} isActive={explorer.activePaneIndex === 2} onClose={() => setExplorer(closeChangeFilePane)} />
                )}
            </div>
        </main>
    );
}

//
// Scrolls the page by the least amount that shows the last pane in the columns, the one just
// opened, so a pane that opens beyond the right edge of the window comes into view. It scrolls
// smoothly so the user sees where the pane came from, and leaves the page where it is when the pane
// is already in view. The columns are null only before React has drawn them, when there is no pane
// to show.
//
export function scrollLastPaneIntoView(columns: HTMLElement | null): void {
    if (!columns) {
        return;
    }
    const lastPane = columns.lastElementChild;
    if (!lastPane) {
        return;
    }
    lastPane.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
    });
}
