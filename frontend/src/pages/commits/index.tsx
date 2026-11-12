//
// The commits page: lists the first page of the repo's commits in the commit pane. Clicking a
// commit opens the commit details pane to its right and clicking a changed file there opens the
// file pane to its right, like the column view of a file browser. The arrow keys, Enter and
// Escape move through the panes as in the column view of macOS Finder.
//

import { Link } from "@tanstack/react-router";
import { JSX, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRepo } from "../../components/repo-context";
import { closeCommitDetailsPane, closeFilePane, explorerStateAfterKey, initialCommitExplorerState, isExplorerKey, isExplorerKeyTarget, selectCommit, selectFile } from "../../lib/commit-explorer";
import { ICommit, readCommitPage } from "../../lib/commits";
import { CommitDetailsPane } from "./components/commit-details-pane";
import { CommitPane } from "./components/commit-pane";
import { FilePane } from "./components/file-pane";

//
// The most commits the page lists. It lists the first page only, and this many fills a window
// with room to spare.
//
const COMMIT_PAGE_SIZE = 50;

//
// What the commit columns are given: the repo to read.
//
export interface ICommitColumnsProps {
    // The repo to read.
    repoPath: string;
}

//
// Shows the commit columns of the open repo. Opening another repo shows its columns afresh, with no
// commit or file open, because the columns are keyed by the repo's path. While no repo is open it
// shows that no repo is open, because the commit explorer has no repo to read.
//
export function CommitsPage(): JSX.Element {
    const { repoPath } = useRepo();
    if (!repoPath) {
        return (
            <main data-id="commits-page">
                <h1 data-id="commits-heading">Commits</h1>
                <p data-id="commits-no-repo">No repo is open. Choose File, then Open repo, to open one.</p>
            </main>
        );
    }
    return <CommitColumns key={repoPath} repoPath={repoPath} />;
}

//
// Shows the first page of the repo's commits, newest first, with a link back to the About page.
// It shows that it is loading until the commits task ends, and what went wrong when the commits
// could not be read. It owns the commit explorer's state (lib/commit-explorer.ts): which pane is
// active, which commit and file are selected and which are open, because each pane opens the next:
// a newly clicked commit closes the file pane and closing the commit details pane closes the file
// pane with it. Dates are shown in the browser's own locale and time zone. When a pane opens, the
// page scrolls sideways to bring it into view, because the newest pane is the one the user wants
// to read and it can open beyond the right edge of the window. While the page is shown it handles
// the arrow keys, Enter and Escape itself, on the document in the capture phase, so the key reaches
// it before a focused row's own Enter handling and the page does not also scroll. It leaves the
// keys to a text box, link, button, menu or dialog that has the focus. It takes the focus when it
// opens, so the keys work at once after the left sidebar's link or Ctrl+1 opened it, while the
// focus would otherwise stay on the link outside the page. It takes the focus and sets up the key
// listener with the items just drawn as React draws them (in layout effects), before the browser
// paints, so a key pressed as soon as the page or its items show acts on them.
//
export function CommitColumns({ repoPath }: ICommitColumnsProps): JSX.Element {
    const [commits, setCommits] = useState<ICommit[] | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);
    const [explorer, setExplorer] = useState(initialCommitExplorerState);
    const [filePaths, setFilePaths] = useState<string[]>([]);
    const pageRef = useRef<HTMLElement>(null);
    const columnsRef = useRef<HTMLDivElement>(null);
    const dateFormat = Intl.DateTimeFormat().resolvedOptions();

    useEffect(() => {
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
    }, [repoPath]);

    useLayoutEffect(() => {
        pageRef.current?.focus({
            preventScroll: true,
        });
    }, []);

    useEffect(() => {
        setFilePaths([]);
    }, [explorer.openHash]);

    useEffect(() => {
        if (explorer.openHash) {
            scrollLastPaneIntoView(columnsRef.current);
        }
    }, [explorer.openHash, explorer.openPath]);

    useLayoutEffect(() => {
        const items = {
            commitHashes: (commits ?? []).map(commit => commit.hash),
            filePaths,
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
    }, [commits, filePaths]);

    return (
        <main ref={pageRef} tabIndex={-1} data-id="commits-page" className="outline-none flex min-h-full w-max min-w-full flex-col gap-4 bg-gray-50 p-6 dark:bg-transparent">
            <div className="flex items-baseline gap-4">
                <h1 data-id="commits-heading" className="text-2xl font-bold">Commits</h1>
                <Link to="/about" data-id="commits-about-link" className="text-sm text-blue-700 hover:underline dark:text-blue-400">About</Link>
            </div>
            <div ref={columnsRef} data-id="commit-columns" className="flex items-start gap-3">
                <CommitPane commits={commits} error={error} selectedHash={explorer.selectedHash} openHash={explorer.openHash} isActive={explorer.activePaneIndex === 0} dateFormat={dateFormat} onSelectCommit={hash => setExplorer(selectCommit(hash))} />
                {explorer.openHash !== undefined && (
                    <CommitDetailsPane
                        key={explorer.openHash}
                        repoPath={repoPath}
                        hash={explorer.openHash}
                        selectedPath={explorer.selectedPath}
                        isActive={explorer.activePaneIndex === 1}
                        dateFormat={dateFormat}
                        onSelectFile={path => setExplorer(state => selectFile(state, path))}
                        onReadFiles={setFilePaths}
                        onClose={() => setExplorer(closeCommitDetailsPane)}
                    />
                )}
                {explorer.openHash !== undefined && explorer.openPath !== undefined && (
                    <FilePane key={`${explorer.openHash} ${explorer.openPath}`} repoPath={repoPath} hash={explorer.openHash} path={explorer.openPath} isActive={explorer.activePaneIndex === 2} onClose={() => setExplorer(closeFilePane)} />
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
