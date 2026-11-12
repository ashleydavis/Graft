//
// Graft's actions: named pieces of its functionality that take no arguments, whose handlers are in
// the frontend. A menu item, a shortcut, the frontend or the backend runs one by its name. See
// Ziggy's guide "Actions".
//

const ziggy = @import("ziggy");

//
// The actions Graft passes to ziggy.core.App as `.actions`. Open repo is on the File menu. Its
// frontend handler shows the folder picker and opens the folder chosen in the commit explorer.
//
pub const actions: []const ziggy.action.Action = &.{
    .{
        .name = "open-repo",
        .label = "Open repo",
    },
};
