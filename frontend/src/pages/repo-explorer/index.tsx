//
// The repo explorer page: shows the open repo in the repo details pane. Clicking its Commits link
// opens the commit pane to its right with the repo's commits, read a page at a time as the list
// scrolls, clicking a commit opens the commit details pane to its right and clicking a changed file
// there opens the file pane to its right, or its "Commit details" row the "Commit details" pane in
// the file pane's place, like the column view of a file browser. Its Changes link opens the changes
// pane in place of the commit pane, with the working tree's unstaged and staged files, and clicking
// a file there opens its file pane. The arrow keys, Page Up, Page Down, Enter and Escape move through the panes as in
// the column view of macOS Finder. Clicking anywhere in a pane makes it the active pane. Each pane's
// maximise button, or M, makes the pane fill the page with the other panes hidden, and restores
// them. Each pane's collapse button, or C, folds it into a narrow strip with its title down it.
//

import { JSX, MouseEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useActivePane } from "../../components/active-pane";
import { copyText } from "../../components/copy-button";
import { usePaneTrail } from "../../components/pane-trail";
import { useRepo } from "../../components/repo-context";
import { repoExplorerActivePane } from "../../lib/active-pane";
import { explorerPaneSteps } from "../../lib/breadcrumb-trail";
import { commitStagedFiles } from "../../lib/commit";
import { canReadNextPage, COMMIT_PAGE_SIZE, commitPagesAfterRead, commitPagesReading, ICommitPages, nextPageStart, noCommitPages } from "../../lib/commit-pages";
import { ICommit, ICommitPageStart, readCommitPage } from "../../lib/commits";
import { openPaneIds } from "../../lib/pane-animation";
import { PANE_LIMITS } from "../../lib/pane-widths";
import { activatePane, changeKey, changeKeysOf, closeChangeFilePane, closeCommitDetailsPane, closeFilePane, closeLinkPane, COMMIT_DETAILS_PATH, CHANGES_LINK, COMMITS_LINK, explorerStateAfterKey, findChange, followMovedChange, hasKeyModifier, hasSelectedText, initialRepoExplorerState, IRepoExplorerState, isCopyKey, isExplorerKey, isExplorerKeyTarget, isPaneCollapsed, isResizeHandleKey, keepListedChanges, keepMaximisedPaneShown, measurePageRowCount, selectChange, selectedItemText, selectFirstFile, selectCommit, selectFile, selectLink, targetPaneIndex, toggleCollapsedPane, toggleMaximise } from "../../lib/repo-explorer";
import { toggleFileStaged } from "../../lib/stage-file";
import { IWorkingChanges, IWorkingFile, readWorkingChanges } from "../../lib/working-changes";
import { AnimatedPane, openColumnClass } from "./components/animated-pane";
import { ChangesPane } from "./components/changes-pane";
import { CommitDetailsPane } from "./components/commit-details-pane";
import { CommitInfoPane } from "./components/commit-info-pane";
import { CommitPane } from "./components/commit-pane";
import { FilePane } from "./components/file-pane";
import { usePaneWidth } from "./components/pane-width-state";
import { RepoDetailsPane } from "./components/repo-details-pane";
import { ResizeHandle } from "./components/resize-handle";
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
// shows placeholder rows while a page is read and what went wrong when one could not be read. It owns
// the repo explorer's state (lib/repo-explorer.ts): which pane is active, which link, commit and
// file are selected, which are open and which panes are collapsed into a strip, because each pane opens the next: a newly clicked commit
// closes the file pane and closing a pane closes the panes to its right. Dates are shown in the
// browser's own locale and time zone. When a pane opens, the page scrolls sideways to bring it into
// view, because the newest pane is the one the user wants to read and it can open beyond the right
// edge of the window. While the page is shown it handles the arrow keys, Page Up, Page Down, Enter, Escape, M and C itself,
// on the document in the capture phase, so the key reaches it before a focused row's own Enter
// handling and the page does not also scroll. It leaves the keys to a text box, link, button, menu
// or dialog that has the focus. Ctrl+C (Cmd+C on macOS) copies the active pane's selected item in
// the same listener. It takes the focus when it opens, so the keys work at once after
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
// when the page closes, so the trail always ends with the rightmost pane. Every change to the
// explorer's state goes through keepMaximisedPaneShown, so a maximised pane that closes or stops
// being active puts the other panes back. While a pane is maximised the other panes stay drawn,
// hidden, so they come back as they were, and the page is as wide as the window, so the maximised
// pane fills it. Its maximise button gives the focus back to the page, so the keys work at once.
// Restoring the panes scrolls the active pane into view, because the page's sideways scroll is
// lost while it is as wide as the window. It sets the layout's active pane each time the active
// pane changes, and clears it when the page closes, so the command palette lists the active
// pane's commands first. Each pane with a pane open to its right has a resize handle in the gap
// between them, which sets the pane's width and saves it in Graft's state file, and the page leaves
// Left and Right to a focused handle. A pane that is collapsed or maximised has no handle.
//
export function RepoExplorer({ repoPath }: IRepoExplorerProps): JSX.Element {
    const [commitPages, setCommitPages] = useState<ICommitPages>(noCommitPages);
    const [explorer, setExplorerState] = useState(initialRepoExplorerState);
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
    const wasMaximisedRef = useRef(false);
    const dateFormat = Intl.DateTimeFormat().resolvedOptions();
    const isCommitsOpen = explorer.openLink === COMMITS_LINK;
    const isChangesOpen = explorer.openLink === CHANGES_LINK;
    const { setPaneSteps } = usePaneTrail();
    const { setActivePane } = useActivePane();
    const repoDetailsWidth = usePaneWidth("repoDetails");
    const commitsWidth = usePaneWidth("commits");
    const commitDetailsWidth = usePaneWidth("commitDetails");
    const changesWidth = usePaneWidth("changes");

    //
    // Changes the explorer's state with the change, then puts the panes back when the maximised
    // pane has closed or is no longer active, so every change keeps the active pane in view.
    //
    function setExplorer(change: (state: IRepoExplorerState) => IRepoExplorerState): void {
        setExplorerState(state => keepMaximisedPaneShown(change(state)));
    }

    //
    // Maximises the pane at the index or restores the panes, as its maximise button does, and
    // gives the focus back to the page from the button, so the keys act on the pane at once.
    //
    function onToggleMaximise(paneIndex: number): void {
        setExplorer(state => toggleMaximise(state, paneIndex));
        pageRef.current?.focus({
            preventScroll: true,
        });
    }

    //
    // Returns true when the pane at the index is hidden because another pane is maximised.
    //
    function isPaneHidden(paneIndex: number): boolean {
        if (explorer.maximisedPaneIndex === undefined) {
            return false;
        }
        return explorer.maximisedPaneIndex !== paneIndex;
    }

    //
    // Returns true when the pane at the index shows its resize handle: while it is neither collapsed
    // into a strip nor maximised, because then its width is not the one the handle sets.
    //
    function hasResizeHandle(paneIndex: number): boolean {
        if (isPaneCollapsed(explorer, paneIndex)) {
            return false;
        }
        return explorer.maximisedPaneIndex !== paneIndex;
    }

    //
    // Picks the width the pane at the index is drawn at: the width its resize handle set, or none
    // while the pane is maximised, because a maximised pane fills the repo explorer.
    //
    function paneWidthOf(paneIndex: number, width: number | undefined): number | undefined {
        if (explorer.maximisedPaneIndex === paneIndex) {
            return undefined;
        }
        return width;
    }

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

    useEffect(() => {
        if (explorer.maximisedPaneIndex !== undefined) {
            wasMaximisedRef.current = true;
            return;
        }
        if (!wasMaximisedRef.current) {
            return;
        }
        wasMaximisedRef.current = false;
        scrollPaneIntoView(columnsRef.current, explorer.activePaneIndex);
    }, [explorer.maximisedPaneIndex]);

    useLayoutEffect(() => {
        const items = {
            links: [COMMITS_LINK, CHANGES_LINK],
            commitHashes: commitPages.commits.map(commit => commit.hash),
            filePaths,
            changeKeys: changeKeysOf(changes),
        };

        function onKeyDown(event: KeyboardEvent): void {
            if (isCopyKey(event)) {
                copySelectedItem(event);
                return;
            }
            if (!isExplorerKey(event.key)) {
                return;
            }
            if (!isExplorerKeyTarget(event.target, pageRef.current, hasKeyModifier(event))) {
                return;
            }
            if (isResizeHandleKey(event.target, event.key)) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            setExplorer(state => explorerStateAfterKey(state, event.key, {
                ...items,
                pageRowCount: measurePageRowCount(pageRef.current, state),
            }));
        }

        //
        // Copies the active pane's selected item, as selectedItemText picks it, when the copy key
        // is pressed on the page, and keeps the key from Ziggy's Copy shortcut, so the clipboard
        // holds the item, or keeps what it held when no item is selected. The key is left to a text
        // box, link, button, menu or dialog with the focus and to text the user has selected on the
        // page, so Ziggy's Copy copies that text as usual.
        //
        function copySelectedItem(event: KeyboardEvent): void {
            if (!isExplorerKeyTarget(event.target, pageRef.current, false)) {
                return;
            }
            if (hasSelectedText(document.getSelection())) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            const text = selectedItemText(explorer, changes);
            if (text === undefined) {
                return;
            }
            copyText(text, () => undefined);
        }

        document.addEventListener("keydown", onKeyDown, {
            capture: true,
        });
        return () => document.removeEventListener("keydown", onKeyDown, {
            capture: true,
        });
    }, [commitPages.commits, filePaths, changes, explorer]);

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

    //
    // Collapses the pane at the position among the open panes, or restores it, as its collapse
    // button and its strip's restore button do.
    //
    function onToggleCollapse(paneIndex: number): void {
        setExplorer(state => toggleCollapsedPane(state, paneIndex));
    }

    return (
        <main ref={pageRef} tabIndex={-1} data-id="repo-explorer-page" className={`graft-page-in outline-none flex h-full ${pageWidthClass(explorer.maximisedPaneIndex !== undefined)} flex-col gap-4 bg-[var(--color-bg)] p-6`}>
            <div ref={columnsRef} data-id="repo-explorer-columns" onClickCapture={onColumnsClickCapture} className="flex min-h-0 flex-1 items-stretch gap-3">
                <div className={`relative ${openColumnClass(isPaneHidden(0), explorer.maximisedPaneIndex === 0)}`}>
                    <RepoDetailsPane repoPath={repoPath} selectedLink={explorer.selectedLink} openLink={explorer.openLink} isActive={explorer.activePaneIndex === 0} isMaximised={explorer.maximisedPaneIndex === 0} onToggleMaximise={() => onToggleMaximise(0)} isHidden={isPaneHidden(0)} isCollapsed={isPaneCollapsed(explorer, 0)} onToggleCollapse={() => onToggleCollapse(0)} onSelectLink={link => setExplorer(() => selectLink(link))} width={paneWidthOf(0, repoDetailsWidth.width)} />
                    {explorer.openLink !== undefined && hasResizeHandle(0) && (
                        <ResizeHandle label="repo details pane" dataId="repo-details-pane-resize-handle" limits={PANE_LIMITS.repoDetails} onWidth={repoDetailsWidth.changeWidth} onReset={repoDetailsWidth.resetWidth} />
                    )}
                </div>
                <AnimatedPane openId={paneIds.commitPane} isHidden={isPaneHidden(1)} isMaximised={explorer.maximisedPaneIndex === 1}>
                    {isCommitsOpen && (
                        <>
                            <CommitPane
                                commits={commitPages.commits}
                                isLoading={commitPages.readTaskId !== undefined}
                                error={commitPages.error}
                                hasReadLastPage={commitPages.hasReadLastPage}
                                selectedHash={explorer.selectedHash}
                                openHash={explorer.openHash}
                                isActive={explorer.activePaneIndex === 1}
                                isMaximised={explorer.maximisedPaneIndex === 1}
                                onToggleMaximise={() => onToggleMaximise(1)}
                                isCollapsed={isPaneCollapsed(explorer, 1)}
                                onToggleCollapse={() => onToggleCollapse(1)}
                                dateFormat={dateFormat}
                                onSelectCommit={hash => setExplorer(state => selectCommit(state, hash))}
                                onNearEnd={readNextPage}
                                onClose={() => setExplorer(closeLinkPane)}
                                width={paneWidthOf(1, commitsWidth.width)}
                            />
                            {explorer.openHash !== undefined && hasResizeHandle(1) && (
                                <ResizeHandle label="commit pane" dataId="commit-pane-resize-handle" limits={PANE_LIMITS.commits} onWidth={commitsWidth.changeWidth} onReset={commitsWidth.resetWidth} />
                            )}
                        </>
                    )}
                </AnimatedPane>
                <AnimatedPane openId={paneIds.commitDetailsPane} isHidden={isPaneHidden(2)} isMaximised={explorer.maximisedPaneIndex === 2}>
                    {explorer.openHash !== undefined && (
                        <>
                            <CommitDetailsPane
                                key={explorer.openHash}
                                repoPath={repoPath}
                                hash={explorer.openHash}
                                selectedPath={explorer.selectedPath}
                                openPath={explorer.openPath}
                                isActive={explorer.activePaneIndex === 2}
                                isMaximised={explorer.maximisedPaneIndex === 2}
                                onToggleMaximise={() => onToggleMaximise(2)}
                                isCollapsed={isPaneCollapsed(explorer, 2)}
                                onToggleCollapse={() => onToggleCollapse(2)}
                                onSelectFile={path => setExplorer(state => selectFile(state, path))}
                                onReadCommit={details => {
                                    const paths = details.changedFiles.map(file => file.path);
                                    setFilePaths([COMMIT_DETAILS_PATH, ...paths]);
                                    setOpenCommit(details.commit);
                                    setExplorer(state => selectFirstFile(state, paths));
                                }}
                                onClose={() => setExplorer(closeCommitDetailsPane)}
                                width={paneWidthOf(2, commitDetailsWidth.width)}
                            />
                            {explorer.openPath !== undefined && hasResizeHandle(2) && (
                                <ResizeHandle label="commit details pane" dataId="commit-details-pane-resize-handle" limits={PANE_LIMITS.commitDetails} onWidth={commitDetailsWidth.changeWidth} onReset={commitDetailsWidth.resetWidth} />
                            )}
                        </>
                    )}
                </AnimatedPane>
                <AnimatedPane openId={paneIds.filePane} isHidden={isPaneHidden(3)} isMaximised={explorer.maximisedPaneIndex === 3}>
                    {explorer.openPath === COMMIT_DETAILS_PATH && openCommit && (
                        <CommitInfoPane commit={openCommit} isActive={explorer.activePaneIndex === 3} isMaximised={explorer.maximisedPaneIndex === 3} onToggleMaximise={() => onToggleMaximise(3)} isCollapsed={isPaneCollapsed(explorer, 3)} onToggleCollapse={() => onToggleCollapse(3)} dateFormat={dateFormat} onClose={() => setExplorer(closeFilePane)} />
                    )}
                    {explorer.openHash !== undefined && explorer.openPath !== undefined && explorer.openPath !== COMMIT_DETAILS_PATH && (
                        <FilePane key={`${explorer.openHash} ${explorer.openPath}`} repoPath={repoPath} hash={explorer.openHash} path={explorer.openPath} isActive={explorer.activePaneIndex === 3} isMaximised={explorer.maximisedPaneIndex === 3} onToggleMaximise={() => onToggleMaximise(3)} isCollapsed={isPaneCollapsed(explorer, 3)} onToggleCollapse={() => onToggleCollapse(3)} onClose={() => setExplorer(closeFilePane)} />
                    )}
                </AnimatedPane>
                <AnimatedPane openId={paneIds.changesPane} isHidden={isPaneHidden(1)} isMaximised={explorer.maximisedPaneIndex === 1}>
                    {isChangesOpen && (
                        <>
                            <ChangesPane
                                repoPath={repoPath}
                                changes={changes}
                                error={changesError}
                                stageError={stageError}
                                selectedKey={explorer.selectedChange}
                                openKey={explorer.openChange}
                                isActive={explorer.activePaneIndex === 1}
                                isMaximised={explorer.maximisedPaneIndex === 1}
                                onToggleMaximise={() => onToggleMaximise(1)}
                                isCollapsed={isPaneCollapsed(explorer, 1)}
                                onToggleCollapse={() => onToggleCollapse(1)}
                                onSelectChange={key => setExplorer(state => selectChange(state, key))}
                                onToggleStaged={onToggleStaged}
                                commitMessage={commitMessage}
                                commitError={commitError}
                                isCommitting={isCommitting}
                                onCommitMessageChange={setCommitMessage}
                                onCommit={onCommit}
                                width={paneWidthOf(1, changesWidth.width)}
                            />
                            {openChange !== undefined && hasResizeHandle(1) && (
                                <ResizeHandle label="changes pane" dataId="changes-pane-resize-handle" limits={PANE_LIMITS.changes} onWidth={changesWidth.changeWidth} onReset={changesWidth.resetWidth} />
                            )}
                        </>
                    )}
                </AnimatedPane>
                <AnimatedPane openId={paneIds.workingFilePane} isHidden={isPaneHidden(2)} isMaximised={explorer.maximisedPaneIndex === 2}>
                    {isChangesOpen && openChange && (
                        <WorkingFilePane key={`${explorer.openChange} ${changesReadCount}`} repoPath={repoPath} file={openChange.file} isStaged={openChange.isStaged} isActive={explorer.activePaneIndex === 2} isMaximised={explorer.maximisedPaneIndex === 2} onToggleMaximise={() => onToggleMaximise(2)} isCollapsed={isPaneCollapsed(explorer, 2)} onToggleCollapse={() => onToggleCollapse(2)} onClose={() => setExplorer(closeChangeFilePane)} />
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

//
// Scrolls the page by the least amount that shows the pane at the index among the columns, so the
// pane the keys act on is in view after the panes are restored. The columns
// are null only before React has drawn them, when there is no pane to show.
//
export function scrollPaneIntoView(columns: HTMLElement | null, paneIndex: number): void {
    if (!columns) {
        return;
    }
    const pane = columns.children.item(paneIndex);
    if (!pane) {
        return;
    }
    pane.scrollIntoView({
        behavior: "instant",
        block: "nearest",
        inline: "nearest",
    });
}

//
// Picks the Tailwind classes of the page's width: as wide as its panes, and at least as wide as
// the window, so the panes sit side by side and the page scrolls sideways when they are wider than
// the window, or exactly as wide as the window while a pane is maximised, so the maximised pane
// fills it.
//
export function pageWidthClass(isMaximised: boolean): string {
    if (isMaximised) {
        return "w-full";
    }
    return "w-max min-w-full";
}
