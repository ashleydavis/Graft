//
// Opens another window of Graft for the new-window action, through Ziggy's support for new
// windows.
//

//
// The name of the new-window action, declared in the backend's features/new-window.zig, which the
// File menu's "New window" item and the shortcut CmdOrCtrl+N run. useNewWindowAction registers its
// handler and removes it again under this name.
//
export const newWindowActionName = "new-window";

//
// Runs the new-window action: Ziggy starts another window of Graft as a process of its own, with
// its own backend and task queue. The promise resolves once that process has started. The new
// window is given no arguments of its own, so it starts as Graft does, on the welcome page with no
// repo open. It rejects when the window could not be started. Ziggy writes the rejection, named for
// the new-window action, to the backend's log.
//
export function openNewWindow(): Promise<void> {
    return window.ziggy.newWindow([]);
}
