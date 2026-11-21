//
// Graft's declaration to Ziggy: the messages its frontend sends and the tasks it queues, each with
// the Zig function that handles it, its menu, its actions and its built frontend. Each feature
// declares its own messages and tasks in its file under backend/src/features/, and this file lists
// the features. Ziggy's build serves the app declared here.
//

const ziggy = @import("ziggy");
const repo_explorer = @import("features/repo-explorer.zig");
const changes = @import("features/changes.zig");
const open_repo = @import("features/open-repo.zig");
const zoom = @import("features/zoom.zig");
const actions = @import("lib/actions.zig");
const menu = @import("lib/menu.zig");
const merge_fields = @import("lib/merge-fields.zig");
const test_mode_query = @import("lib/test-mode-query.zig");
const ui = @import("ui-files");

//
// Graft, registered with Ziggy's core: each message name with its handler and each task type with
// its task, gathered from the features that declare them, one feature per line. Every task runs
// the real Git interface function.
//
pub const app = ziggy.core.App(.{
    .messages = merge_fields.merge_fields(.{
        open_repo.messages,
        zoom.messages,
    }),
    .tasks = merge_fields.merge_fields(.{
        repo_explorer.tasks,
        changes.tasks,
        open_repo.tasks,
    }),
    .menu = menu.menu,
    .actions = actions.actions,
    // The window's colour before the page draws: the style guide's --color-bg in each theme (--gray-50 in light and
    // --gray-950 in dark, in frontend/src/graft.css). main.css and index.html draw the page in the same colours.
    .backgrounds = .{
        .light = 0xFAFAFA,
        .dark = 0x09090B,
    },
    .ui_files = &ui.files,
    .ui_query = test_mode_query.test_mode_query,
});
