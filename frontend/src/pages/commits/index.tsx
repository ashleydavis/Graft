//
// The commits page: lists the first page of the repo's commits in the commit pane, to show that the
// backend runs git log and the frontend receives what it read. Clicking a commit opens the commit
// details pane to its right and clicking a changed file there opens the file pane to its right,
// like the column view of a file browser.
//

import { Link } from "@tanstack/react-router";
import { JSX, useEffect, useState } from "react";
import { useRepo } from "../../components/repo-context";
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
// Shows the first page of the repo's commits as a plain list, newest first, with a link back to
// the About page. It shows that it is loading until the commits task ends, and what went wrong
// when the commits could not be read. It owns which commit and which changed file are open, because
// each pane opens the next: a newly clicked commit closes the file pane and closing the commit
// details pane closes the file pane with it.
//
export function CommitColumns({ repoPath }: ICommitColumnsProps): JSX.Element {
    const [commits, setCommits] = useState<ICommit[] | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);
    const [openHash, setOpenHash] = useState<string | undefined>(undefined);
    const [openPath, setOpenPath] = useState<string | undefined>(undefined);

    function openCommit(hash: string): void {
        setOpenHash(hash);
        setOpenPath(undefined);
    }

    function closeCommit(): void {
        setOpenHash(undefined);
        setOpenPath(undefined);
    }

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

    return (
        <main data-id="commits-page">
            <h1 data-id="commits-heading">Commits</h1>
            <Link to="/" data-id="commits-about-link">About</Link>
            <div data-id="commit-columns" className="flex items-start gap-4">
                <CommitPane commits={commits} error={error} onSelectCommit={openCommit} />
                {openHash !== undefined && (
                    <CommitDetailsPane key={openHash} repoPath={repoPath} hash={openHash} onSelectFile={setOpenPath} onClose={closeCommit} />
                )}
                {openHash !== undefined && openPath !== undefined && (
                    <FilePane key={`${openHash} ${openPath}`} repoPath={repoPath} hash={openHash} path={openPath} onClose={() => setOpenPath(undefined)} />
                )}
            </div>
        </main>
    );
}
