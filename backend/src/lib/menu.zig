//
// Graft's desktop menu. The native app draws it with the platform's own menu API on every desktop
// platform.
//
// Each item names what it runs. An `.action` item runs one of the actions in actions.zig, whose
// handler is in the frontend. A `.standard` item is an action the native app does itself (quit,
// close-window, reload, the zoom and editing actions, full screen and the developer tools). A
// `.zig` item calls a Zig function of the app's on the thread that handles messages. A `.ui` item
// reaches the frontend as the app event {"type": "menu", "item": "<name>"}; each of those has a
// `.name`. Each feature declares the items that run its actions in its file under
// backend/src/features/, and this file puts them in their menus. See Ziggy's guide "Menus".
//

const ziggy = @import("ziggy");
const new_window = @import("../features/new-window.zig");
const open_repo = @import("../features/open-repo.zig");
const zoom = @import("../features/zoom.zig");

//
// The menu Graft passes to ziggy.core.App as `.menu`.
//
pub const menu: []const ziggy.menu.Menu = &.{
    .{
        .label = "File",
        .items = new_window.file_menu_items ++
            open_repo.file_menu_items ++
            &[_]ziggy.menu.Item{
                ziggy.menu.separator,
                .{
                    .label = "Close Window",
                    .shortcut = "CmdOrCtrl+W",
                    .run = .{
                        .standard = .@"close-window",
                    },
                },
                .{
                    .label = "Quit",
                    .shortcut = "CmdOrCtrl+Q",
                    .run = .{
                        .standard = .quit,
                    },
                },
            },
    },
    .{
        .label = "Edit",
        .items = &.{
            .{
                .label = "Undo",
                .shortcut = "CmdOrCtrl+Z",
                .run = .{
                    .standard = .undo,
                },
            },
            .{
                .label = "Redo",
                .shortcut = "CmdOrCtrl+Shift+Z",
                .run = .{
                    .standard = .redo,
                },
            },
            ziggy.menu.separator,
            .{
                .label = "Cut",
                .shortcut = "CmdOrCtrl+X",
                .run = .{
                    .standard = .cut,
                },
            },
            .{
                .label = "Copy",
                .shortcut = "CmdOrCtrl+C",
                .run = .{
                    .standard = .copy,
                },
            },
            .{
                .label = "Paste",
                .shortcut = "CmdOrCtrl+V",
                .run = .{
                    .standard = .paste,
                },
            },
            .{
                .label = "Select All",
                .shortcut = "CmdOrCtrl+A",
                .run = .{
                    .standard = .@"select-all",
                },
            },
        },
    },
    .{
        .label = "View",
        .items = &[_]ziggy.menu.Item{
            .{
                .label = "Reload",
                .shortcut = "CmdOrCtrl+R",
                .run = .{
                    .standard = .reload,
                },
            },
            ziggy.menu.separator,
        } ++
            zoom.view_menu_items ++
            &[_]ziggy.menu.Item{
                ziggy.menu.separator,
                .{
                    .label = "Toggle Full Screen",
                    .shortcut = "F11",
                    .run = .{
                        .standard = .@"toggle-fullscreen",
                    },
                },
                ziggy.menu.separator,
                .{
                    .label = "Toggle Developer Tools",
                    .shortcut = "CmdOrCtrl+Shift+I",
                    .run = .{
                        .standard = .@"toggle-devtools",
                    },
                },
            },
    },
};
