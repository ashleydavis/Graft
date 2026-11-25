//
// The repo explorer page: shows the open repo in the repo details pane. Clicking its Commits link
// opens the commit pane to its right with the repo's commits, read a page at a time as the list
// scrolls, clicking a commit opens the commit details pane to its right and clicking a changed file
// there opens the file pane to its right, or its "Commit details" row the "Commit details" pane in
// the file pane's place, like the column view of a file browser. Its Changes link opens the changes
// pane in place of the commit pane, with the working tree's unstaged and staged files, and clicking
// a file there opens its file pane. The arrow keys, Enter and Escape move through the panes as in
// the column view of macOS Finder. Clicking anywhere in a pane makes it the active pane.
//

import { JSX, MouseEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useActivePane } from "../../components/active-pane";
import { usePaneTrail } from "../../components/pane-trail";
import { useRepo } from "../../components/repo-context";
import { repoExplorerActivePane } from "../../lib/active-pane";
import { explorerPaneSteps } from "../../lib/breadcrumb-trail";
import { commitStagedFiles } from "../../lib/commit";
import { canReadNextPage, COMMIT_PAGE_SIZE, commitPagesAfterRead, commitPagesReading, ICommitPages, nextPageStart, noCommitPages } from "../../lib/commit-pages";
import { ICommit, ICommitPageStart, readCommitPage } from "../../lib/commits";
import { openPaneIds } from "../../lib/pane-animation";
import { activatePane, changeKey, changeKeysOf, closeChangeFilePane, closeCommitDetailsPane, closeFilePane, closeLinkPane, COMMIT_DETAILS_PATH, CHANGES_LINK, COMMITS_LINK, explorerStateAfterKey, findChange, followMovedChange, initialRepoExplorerState, IRepoExplorerState, isExplorerKey, isExplorerKeyTarget, keepListedChanges, selectChange, selectFirstFile, selectCommit, selectFile, selectLink, targetPaneIndex } from "../../lib/repo-explorer";
import { toggleFileStaged } from "../../lib/stage-file";
import { IWorkingChanges, IWorkingFile, readWorkingChanges } from "../../lib/working-changes";
import { AnimatedPane } from "./components/animated-pane";
import { ChangesPane } from "./components/changes-pane";
import { CommitDetailsPane } from "./components/commit-details-pane";
import { CommitInfoPane } from "./components/commit-info-pane";
import { CommitPane } from "./components/commit-pane";
import { FilePane } from "./components/file-pane";
import { RepoDetailsPane } from "./components/repo-details-pane";
import { WorkingFilePane } from "./components/working-file-pane";

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
// is open it shows only that no repo is open, because the repo explorer has no repo to show and the
// breadcrumb trail already names the page.
//
export function RepoExplorerPage(): JSX.Element {
    const { repoPath } = useRepo();
    if (!repoPath) {
        return (
            <main data-id="repo-explorer-page" className="graft-page-in flex flex-col gap-4 p-6">
                <p data-id="repo-explorer-no-repo" className="text-[var(--color-text-muted)]">No repo is open. Choose File, then Open repo, to open one.</p>
            </main>
        );
    }
    return <RepoExplorer key={repoPath} repoPath={repoPath} />;
}

//
// Shows the repo details pane, then the panes the user opens from it, starting at the top of the
// page because the breadcrumb trail already names the page. It reads the first page of the repo's
// commits, newest first, when the Commits link opens the commit pane, and reads them afresh each
// time the pane opens. It reads the next page when the commit list scrolls near the last commit
// read, one page at a time, until the page that ends at the repo's first commit. The commit pane
// shows a loading row while a page is read and what went wrong when one could not be read. It owns
// the repo explorer's state (lib/repo-explorer.ts): which pane is active, which link, commit and
// file are selected and which are open, because each pane opens the next: a newly clicked commit
// closes the file pane and closing a pane closes the panes to its right. Dates are shown in the
// browser's own locale and time zone. When a pane opens, the page scrolls sideways to bring it into
// view, because the newest pane is the one the user wants to read and it can open beyond the right
// edge of the window. While the page is shown it handles the arrow keys, Enter and Escape itself,
// on the document in the capture phase, so the key reaches it before a focused row's own Enter
// handling and the page does not also scroll. It leaves the keys to a text box, link, button, menu
// or dialog that has the focus. It takes the focus when it opens, so the keys work at once after
// the left sidebar's link or Ctrl+1 opened it, while the focus would otherwise stay on the link
// outside the page. It takes the focus and sets up the key listener with the items just drawn as
// React draws them (in layout effects), before the browser paints, so a key pressed as soon as the
// page or its items show acts on them. It reads the working tree's changes when the Changes link
// opens the changes pane and again after each stage and unstage, so the lists show what git holds.
// The changed file's pane is keyed by the number of reads, so its diff is read afresh with the
// lists. The Commit button commits the staged files with the message in the commit section, then
// clears the message and reads the changes again, so the staged list empties. The commit pane
// shows the new commit because it reads the commits afresh each time it opens. It puts a step
// for each open pane in the breadcrumb trail each time a pane opens or closes, and takes them out
// when the page closes, so the trail always ends with the rightmost pane. It sets the layout's
// active pane each time the active pane changes, and clears it when the page closes, so the
// command palette lists the active pane's commands first.
//
export function RepoExplorer({ repoPath }: IRepoExplorerProps): JSX.Element {
    const [commitPages, setCommitPages] = useState<ICommitPages>(noCommitPages);
    const [explorer, setExplorer] = useState(initialRepoExplorerState);
    const [filePaths, setFilePaths] = useState<string[]>([]);
    const [openCommit, setOpenCommit] = useState<ICommit | undefined>(undefined);
    const [changes, setChanges] = useState<IWorkingChanges | undefined>(undefined);
    const [changesError, setChangesError] = useState<string | undefined>(undefined);
    const [stageError, setStageError] = useState<string | undefined>(undefined);
    const [changesReadCount, setChangesReadCount] = useState(0);
    const [commitMessage, setCommitMessage] = useState("");
    const [commitError, setCommitError] = useState<string | undefined>(undefined);
    const [isCommitting, setIsCommitting] = useState(false);
    const pageRef = useRef<HTMLElement>(null);
    const columnsRef = useRef<HTMLDivElement>(null);
    const dateFormat = Intl.DateTimeFormat().resolvedOptions();
    const isCommitsOpen = explorer.openLink === COMMITS_LINK;
    const isChangesOpen = explorer.openLink === CHANGES_LINK;
    const { setPaneSteps } = usePaneTrail();
    const { setActivePane } = useActivePane();

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

    //
    // Commits the staged files with the message, then clears the message and reads the changes
    // again. When git refuses, the commit section shows git's reason and keeps the message, so the
    // user can fix the problem and commit again.
    //
    function onCommit(): void {
        setIsCommitting(true);
        commitStagedFiles({
            taskId: `commit-${Date.now()}-${Math.random()}`,
            repoPath,
            message: commitMessage,
        }, result => {
            setIsCommitting(false);
            if (!result.ok) {
                setCommitError(result.error.message);
                return;
            }
            setCommitError(undefined);
            setCommitMessage("");
            readChanges(state => state);
        });
    }

    //
    // Makes the pane the user clicked in active, wherever in the pane the click landed. It runs in
    // the capture phase, before the clicked row or button handles the click, so a row that sets the
    // active pane itself or a close button that moves it to the left has the last word.
    //
    function onColumnsClickCapture(event: MouseEvent<HTMLDivElement>): void {
        const paneIndex = targetPaneIndex(event.currentTarget, event.target);
        if (paneIndex === undefined) {
            return;
        }
        setExplorer(state => activatePane(state, paneIndex));
    }

    useEffect(() => {
        setChanges(undefined);
        setChangesError(undefined);
        setStageError(undefined);
        setCommitError(undefined);
        if (!isChangesOpen) {
            return;
        }
        readChanges(state => state);
    }, [repoPath, isChangesOpen]);

    //
    // Reads the page of commits the start names, or the first page for undefined, and adds it to
    // the pages once the commits task ends. The pages record the task's id, so a page read before
    // the commit pane closed and opened again is dropped.
    //
    function readPage(start: ICommitPageStart | undefined): void {
        const taskId = `commits-${Date.now()}-${Math.random()}`;
        setCommitPages(pages => commitPagesReading(pages, taskId));
        readCommitPage({
            taskId,
            repoPath,
            pageSize: COMMIT_PAGE_SIZE,
            start,
        }, result => setCommitPages(pages => commitPagesAfterRead(pages, taskId, result)));
    }

    //
    // Reads the next page when the commit list has scrolled near the last commit read, unless a
    // page is being read, the last page has been read or the last read failed.
    //
    function readNextPage(): void {
        if (canReadNextPage(commitPages)) {
            readPage(nextPageStart(commitPages));
        }
    }

    useEffect(() => {
        setCommitPages(noCommitPages);
        if (!isCommitsOpen) {
            return;
        }
        readPage(undefined);
    }, [repoPath, isCommitsOpen]);

    useLayoutEffect(() => {
        pageRef.current?.focus({
            preventScroll: true,
        });
    }, []);

    useEffect(() => {
        setFilePaths([]);
        setOpenCommit(undefined);
    }, [explorer.openHash]);

    useEffect(() => {
        if (explorer.openLink) {
            scrollLastPaneIntoView(columnsRef.current);
        }
    }, [explorer.openLink, explorer.openHash, explorer.openPath, explorer.openChange]);

    useLayoutEffect(() => {
        const items = {
            links: [COMMITS_LINK, CHANGES_LINK],
            commitHashes: commitPages.commits.map(commit => commit.hash),
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
    }, [commitPages.commits, filePaths, changes]);

    const openChange = findChange(changes, explorer.openChange);
    const changedFilePath = openChange?.file.path;

    useEffect(() => {
        setPaneSteps(explorerPaneSteps(explorer, changedFilePath));
        return () => setPaneSteps([]);
    }, [explorer.openLink, explorer.openHash, explorer.openPath, changedFilePath]);

    useEffect(() => {
        setActivePane(repoExplorerActivePane(explorer));
        return () => setActivePane(undefined);
    }, [explorer.activePaneIndex, explorer.openLink]);
    const paneIds = openPaneIds(explorer, openChange !== undefined);

    return (
        <main ref={pageRef} tabIndex={-1} data-id="repo-explorer-page" className="graft-page-in outline-none flex h-full w-max min-w-full flex-col gap-4 bg-[var(--color-bg)] p-6">
            <div ref={columnsRef} data-id="repo-explorer-columns" onClickCapture={onColumnsClickCapture} className="flex min-h-0 flex-1 items-stretch gap-3">
                <RepoDetailsPane repoPath={repoPath} selectedLink={explorer.selectedLink} openLink={explorer.openLink} isActive={explorer.activePaneIndex === 0} onSelectLink={link => setExplorer(selectLink(link))} />
                <AnimatedPane openId={paneIds.commitPane}>
                    {isCommitsOpen && (
                        <CommitPane
                            commits={commitPages.commits}
                            isLoading={commitPages.readTaskId !== undefined}
                            error={commitPages.error}
                            selectedHash={explorer.selectedHash}
                            openHash={explorer.openHash}
                            isActive={explorer.activePaneIndex === 1}
                            dateFormat={dateFormat}
                            onSelectCommit={hash => setExplorer(state => selectCommit(state, hash))}
                            onNearEnd={readNextPage}
                            onClose={() => setExplorer(closeLinkPane)}
                        />
                    )}
                </AnimatedPane>
                <AnimatedPane openId={paneIds.commitDetailsPane}>
                    {explorer.openHash !== undefined && (
                        <CommitDetailsPane
                            key={explorer.openHash}
                            repoPath={repoPath}
                            hash={explorer.openHash}
                            selectedPath={explorer.selectedPath}
                            openPath={explorer.openPath}
                            isActive={explorer.activePaneIndex === 2}
                            onSelectFile={path => setExplorer(state => selectFile(state, path))}
                            onReadCommit={details => {
                                const paths = details.changedFiles.map(file => file.path);
                                setFilePaths([COMMIT_DETAILS_PATH, ...paths]);
                                setOpenCommit(details.commit);
                                setExplorer(state => selectFirstFile(state, paths));
                            }}
                            onClose={() => setExplorer(closeCommitDetailsPane)}
                        />
                    )}
                </AnimatedPane>
                <AnimatedPane openId={paneIds.filePane}>
                    {explorer.openPath === COMMIT_DETAILS_PATH && openCommit && (
                        <CommitInfoPane commit={openCommit} isActive={explorer.activePaneIndex === 3} dateFormat={dateFormat} onClose={() => setExplorer(closeFilePane)} />
                    )}
                    {explorer.openHash !== undefined && explorer.openPath !== undefined && explorer.openPath !== COMMIT_DETAILS_PATH && (
                        <FilePane key={`${explorer.openHash} ${explorer.openPath}`} repoPath={repoPath} hash={explorer.openHash} path={explorer.openPath} isActive={explorer.activePaneIndex === 3} onClose={() => setExplorer(closeFilePane)} />
                    )}
                </AnimatedPane>
                <AnimatedPane openId={paneIds.changesPane}>
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
                            commitMessage={commitMessage}
                            commitError={commitError}
                            isCommitting={isCommitting}
                            onCommitMessageChange={setCommitMessage}
                            onCommit={onCommit}
                        />
                    )}
                </AnimatedPane>
                <AnimatedPane openId={paneIds.workingFilePane}>
                    {isChangesOpen && openChange && (
                        <WorkingFilePane key={`${explorer.openChange} ${changesReadCount}`} repoPath={repoPath} file={openChange.file} isStaged={openChange.isStaged} isActive={explorer.activePaneIndex === 2} onClose={() => setExplorer(closeChangeFilePane)} />
                    )}
                </AnimatedPane>
            </div>
        </main>
    );
}

//
// Scrolls the page by the least amount that shows the last pane in the columns, the one just
// opened, so a pane that opens beyond the right edge of the window comes into view. It scrolls
// smoothly so the user sees where the pane came from, and leaves the page where it is when the pane
// is already in view. It passes over a closing pane, whose column is inert while it animates,
// because the pane the user reads next is the last one still open. The columns are null only
// before React has drawn them, when there is no pane to show.
//
export function scrollLastPaneIntoView(columns: HTMLElement | null): void {
    if (!columns) {
        return;
    }
    const openPanes = columns.querySelectorAll(":scope > :not([inert])");
    const lastPane = openPanes.item(openPanes.length - 1);
    if (!lastPane) {
        return;
    }
    lastPane.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
    });
}
