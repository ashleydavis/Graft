//
// The repo open in Graft's window, kept in a React context at the root of the app so the layout and
// every page read the same repo and it stays loaded while the user moves between pages.
//

import { createContext, JSX, ReactNode, useContext, useState } from "react";

//
// The open repo and how to open another, which RepoProvider gives every component inside it.
//
export interface IRepoContext {
    // The path of the open repo, or undefined while no repo is open.
    repoPath: string | undefined;

    // Opens the repo at the path in place of the one open before.
    openRepo(repoPath: string): void;
}

//
// What RepoProvider is given: the repo open when Graft starts and the app inside it.
//
export interface IRepoProviderProps {
    // The repo open when Graft starts: the test repo a smoke test gave the app, or undefined, so
    // Graft starts with no repo open.
    initialRepoPath: string | undefined;

    // The app, which reads the open repo with useRepo.
    children: ReactNode;
}

//
// The context RepoProvider fills. It is undefined outside a RepoProvider, which useRepo refuses.
//
export const RepoContext = createContext<IRepoContext | undefined>(undefined);

//
// Keeps the open repo for the components inside it. The frontend owns this state, as it owns the
// rest of the window's state, and it lasts as long as the window, so each run starts afresh.
//
export function RepoProvider({ initialRepoPath, children }: IRepoProviderProps): JSX.Element {
    const [repoPath, setRepoPath] = useState<string | undefined>(initialRepoPath);

    function openRepo(newRepoPath: string): void {
        if (newRepoPath.length === 0) {
            throw new Error("openRepo was given an empty path, so there is no folder to open. Pass the path of the folder the user chose.");
        }
        setRepoPath(newRepoPath);
    }

    return (
        <RepoContext.Provider value={{
            repoPath,
            openRepo,
        }}>
            {children}
        </RepoContext.Provider>
    );
}

//
// Reads the open repo and its openRepo callback, for a component inside RepoProvider. It throws
// when there is no RepoProvider around the component, because the component would otherwise never
// see a repo.
//
export function useRepo(): IRepoContext {
    const context = useContext(RepoContext);
    if (!context) {
        throw new Error("useRepo was called outside RepoProvider, so there is no open repo to read. Render the component inside RepoProvider.");
    }
    return context;
}
