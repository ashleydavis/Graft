//
// Graft's actions: named pieces of its functionality, each run by its name alone, whose handlers
// are in the frontend. A menu item, a shortcut, the frontend or the backend runs one by its name.
// Each feature declares its own actions in its file under backend/src/features/, and this file
// joins them into the one list Ziggy takes. See Ziggy's guide "Actions".
//

const ziggy = @import("ziggy");
const commit_explorer = @import("../features/commit-explorer.zig");
const new_window = @import("../features/new-window.zig");
const open_repo = @import("../features/open-repo.zig");
const shortcuts_overlay = @import("../features/shortcuts-overlay.zig");
const zoom = @import("../features/zoom.zig");

//
// The actions Graft passes to ziggy.core.App as `.actions`, one feature per line. The keyboard
// shortcuts overlay lists them in this order, so Open repo comes first and New window last.
//
pub const actions: []const ziggy.action.Action =
    open_repo.actions ++
    shortcuts_overlay.actions ++
    commit_explorer.actions ++
    zoom.actions ++
    new_window.actions;
