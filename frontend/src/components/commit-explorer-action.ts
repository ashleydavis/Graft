//
// The Commit Explorer action's handler, which opens the commits page from any page, registered by
// the hook the layout calls.
//

import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { openPage } from "../lib/navigation";

//
// The name of the backend's Commit Explorer action (backend/src/features/commit-explorer.zig),
// whose shortcut is `CmdOrCtrl+1`. The hook registers its handler under this name and removes it
// under the same name.
//
export const commitExplorerAction = "open-commit-explorer";

//
// Registers the handler of the Commit Explorer action for as long as the component that calls it
// is shown, so Ctrl+1 (Cmd+1 on macOS) returns to the commit explorer from every page. The layout
// calls it, because it is inside the router for as long as the window is open. The handler is
// registered again whenever the router's navigate changes, because it calls the navigate of the
// render that registered it.
//
export function useCommitExplorerAction(): void {
    const navigate = useNavigate();
    useEffect(() => {
        window.ziggy.registerAction(commitExplorerAction, () => openPage(navigate, "/commits"));
        return () => {
            window.ziggy.removeAction(commitExplorerAction);
        };
    }, [navigate]);
}
