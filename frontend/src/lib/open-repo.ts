//
// Opens a local repo for the open-repo action: shows the system folder picker through the
// backend's pick-repo-folder message and passes on the folder the user chose.
//

//
// The name of the open-repo action, declared in the backend's features/open-repo.zig, which the
// File menu's "Open repo" item runs. useOpenRepoAction registers its handler and removes it again
// under this name.
//
export const openRepoActionName = "open-repo";

//
// Shows the system folder picker and resolves with the folder the user chose, or undefined when
// they cancelled. The backend's pick-repo-folder task shows the picker, because every access to the
// computer goes through the backend. It rejects when the picker could not be shown.
//
export async function pickRepoFolder(): Promise<string | undefined> {
    const folder = await window.ziggy.invoke<string | null>("pick-repo-folder", null);
    if (!folder) {
        return undefined;
    }
    return folder;
}

//
// Runs the open-repo action: shows the folder picker and calls onOpen with the folder chosen, so
// the caller opens it in the commit explorer. A cancelled picker opens nothing. It rejects when the
// picker could not be shown, and Ziggy writes the rejection, named for the open-repo action, to the
// backend's log.
//
export async function openPickedRepo(onOpen: (repoPath: string) => void): Promise<void> {
    const folder = await pickRepoFolder();
    if (folder) {
        onOpen(folder);
    }
}
