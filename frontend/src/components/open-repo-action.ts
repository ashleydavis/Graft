//
// The open-repo action's handler, which opens the directory the user picks and shows it in the
// commit explorer, registered by the hook the layout calls.
//

import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { openPage } from "../lib/navigation";
import { openPickedRepo, openRepoActionName } from "../lib/open-repo";
import { useRepo } from "./repo-context";

//
// Registers the handler of the open-repo action for as long as the component that calls it is
// shown. The layout calls it, because it is inside both the router and the open repo's context for
// as long as the window is open. The handler is registered once: openRepo and navigate only call
// the provider's state setter and the router, which stay the same for as long as the layout is
// shown, so the first render's handler stays current.
//
export function useOpenRepoAction(): void {
    const navigate = useNavigate();
    const { openRepo } = useRepo();
    useEffect(() => {
        window.ziggy.registerAction(openRepoActionName, () => openPickedRepo(pickedRepoPath => {
            openRepo(pickedRepoPath);
            openPage(navigate, "/commits");
        }));
        return () => {
            window.ziggy.removeAction(openRepoActionName);
        };
    }, []);
}
