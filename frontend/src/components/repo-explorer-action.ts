//
// The Repo Explorer action's handler, which opens the repo explorer page from any page, registered
// by the hook the layout calls.
//

import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { openPage } from "../lib/navigation";

//
// The name of the backend's Repo Explorer action (backend/src/features/repo-explorer.zig), whose
// shortcut is `CmdOrCtrl+1`. The hook registers its handler under this name and removes it under
// the same name.
//
export const repoExplorerAction = "open-repo-explorer";

//
// Registers the handler of the Repo Explorer action for as long as the component that calls it is
// shown, so Ctrl+1 (Cmd+1 on macOS) returns to the repo explorer from every page. The layout calls
// it, because it is inside the router for as long as the window is open. The handler is registered
// again whenever the router's navigate changes, because it calls the navigate of the render that
// registered it.
//
export function useRepoExplorerAction(): void {
    const navigate = useNavigate();
    useEffect(() => {
        window.ziggy.registerAction(repoExplorerAction, () => openPage(navigate, "/repo-explorer"));
        return () => {
            window.ziggy.removeAction(repoExplorerAction);
        };
    }, [navigate]);
}
