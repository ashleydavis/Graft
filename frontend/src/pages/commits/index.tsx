//
// The commits page: lists the first page of the repo's commits, to show that the backend runs git
// log and the frontend receives what it read.
//

import { Link } from "@tanstack/react-router";
import { JSX, useEffect, useState } from "react";
import { CommitsBridge, ICommit, readCommitPage } from "../../lib/commits";
import { CommitList } from "./components/commit-list";

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
// when the commits could not be read.
//
export function CommitsPage({ bridge, repoPath }: ICommitsPageProps): JSX.Element {
    const [commits, setCommits] = useState<ICommit[] | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);

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
            <CommitList commits={commits} error={error} />
        </main>
    );
}
