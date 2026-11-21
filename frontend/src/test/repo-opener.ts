//
// Opens a repo in the RepoProvider around it as a page first renders, for the tests that render a
// page or the layout with a repo open. It opens the repo through openRepo, as the Open repo action
// does, so the tests use the app's own RepoProvider.
//

import { useEffect } from "react";
import { useRepo } from "../components/repo-context";

//
// What RepoOpener is given: the repo to open.
//
export interface IRepoOpenerProps {
    // The path of the repo to open, or undefined to leave the RepoProvider with no repo open.
    repoPath: string | undefined;
}

//
// Opens the repo at the path once it renders, so the components beside it inside the same
// RepoProvider read that repo.
//
export function RepoOpener({ repoPath }: IRepoOpenerProps): null {
    const { openRepo } = useRepo();
    useEffect(() => {
        if (repoPath) {
            openRepo(repoPath);
        }
    }, [repoPath]);
    return null;
}
