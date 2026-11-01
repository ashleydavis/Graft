//
// The commits page: lists the first page of the repo's commits in the commit pane, to show that the
// backend runs git log and the frontend receives what it read. Clicking a commit opens the commit
// details pane to its right and clicking a changed file there opens the file pane to its right,
// like the column view of a file browser.
//

import { Link } from "@tanstack/react-router";
import { JSX, useEffect, useState } from "react";
import { CommitsBridge, ICommit, readCommitPage } from "../../lib/commits";
import { CommitDetailsPane } from "./components/commit-details-pane";
import { CommitPane } from "./components/commit-pane";
import { FilePane } from "./components/file-pane";

//
// The most commits the page lists. It lists the first page only, and this many fills a window
// with room to spare.
//
const COMMIT_PAGE_SIZE = 50;

//
// What the commits page is given: the bridge to the backend and the repo to read, so a test can
// give it a fake bridge and any path.
//
export interface ICommitsPageProps {
    // The bridge the commits task is queued through: window.ziggy in the app.
    bridge: CommitsBridge;

    // The repo to read.
    repoPath: string;
}

//
// Shows the first page of the repo's commits as a plain list, newest first, with a link back to
// the About page. It shows that it is loading until the commits task ends, and what went wrong
// when the commits could not be read. It owns which commit and which changed file are open, because
// each pane opens the next: a newly clicked commit closes the file pane and closing the commit
// details pane closes the file pane with it.
//
export function CommitsPage({ bridge, repoPath }: ICommitsPageProps): JSX.Element {
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
        readCommitPage(bridge, {
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
    }, [bridge, repoPath]);

    return (
        <main data-id="commits-page">
            <h1 data-id="commits-heading">Commits</h1>
            <Link to="/" data-id="commits-about-link">About</Link>
            <div data-id="commit-columns" className="flex items-start gap-4">
                <CommitPane commits={commits} error={error} onSelectCommit={openCommit} />
                {openHash !== undefined && (
                    <CommitDetailsPane key={openHash} bridge={bridge} repoPath={repoPath} hash={openHash} onSelectFile={setOpenPath} onClose={closeCommit} />
                )}
                {openHash !== undefined && openPath !== undefined && (
                    <FilePane key={`${openHash} ${openPath}`} bridge={bridge} repoPath={repoPath} hash={openHash} path={openPath} onClose={() => setOpenPath(undefined)} />
                )}
            </div>
        </main>
    );
}
