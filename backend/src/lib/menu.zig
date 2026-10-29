//
// Graft's desktop menu. The native app draws it with the platform's own menu API on every desktop
// platform.
//
// Each item names what it runs. A `.standard` item is an action the native app does itself (quit,
// close-window, reload, the zoom and editing actions, full screen and the developer tools). A
// `.zig` item calls a Zig function of the app's on the thread that handles messages. A `.ui` item
// reaches the frontend as the app event {"type": "menu", "item": "<name>"}; each of those has a
// `.name`. See Ziggy's guide "Menus".
//

const ziggy = @import("ziggy");

//
// The menu Graft passes to ziggy.core.App as `.menu`.
//
pub const menu: []const ziggy.menu.Menu = &.{
    .{
        .label = "File",
        .items = &.{
            .{
                .label = "Close Window",
                .accelerator = "CmdOrCtrl+W",
                .run = .{
                    .standard = .@"close-window",
                },
            },
            .{
                .label = "Quit",
                .accelerator = "CmdOrCtrl+Q",
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
                .accelerator = "CmdOrCtrl+Z",
                .run = .{
                    .standard = .undo,
                },
            },
            .{
                .label = "Redo",
                .accelerator = "CmdOrCtrl+Shift+Z",
                .run = .{
                    .standard = .redo,
                },
            },
            ziggy.menu.separator,
            .{
                .label = "Cut",
                .accelerator = "CmdOrCtrl+X",
                .run = .{
                    .standard = .cut,
                },
            },
            .{
                .label = "Copy",
                .accelerator = "CmdOrCtrl+C",
                .run = .{
                    .standard = .copy,
                },
            },
            .{
                .label = "Paste",
                .accelerator = "CmdOrCtrl+V",
                .run = .{
                    .standard = .paste,
                },
            },
            .{
                .label = "Select All",
                .accelerator = "CmdOrCtrl+A",
                .run = .{
                    .standard = .@"select-all",
                },
            },
        },
    },
    .{
        .label = "View",
        .items = &.{
            .{
                .label = "Reload",
                .accelerator = "CmdOrCtrl+R",
                .run = .{
                    .standard = .reload,
                },
            },
            ziggy.menu.separator,
            .{
                .label = "Zoom In",
                .accelerator = "CmdOrCtrl+Plus",
                .run = .{
                    .standard = .@"zoom-in",
                },
            },
            .{
                .label = "Zoom Out",
                .accelerator = "CmdOrCtrl+Minus",
                .run = .{
                    .standard = .@"zoom-out",
                },
            },
            .{
                .label = "Actual Size",
                .accelerator = "CmdOrCtrl+0",
                .run = .{
                    .standard = .@"zoom-reset",
                },
            },
            ziggy.menu.separator,
            .{
                .label = "Toggle Full Screen",
                .accelerator = "F11",
                .run = .{
                    .standard = .@"toggle-fullscreen",
                },
            },
            ziggy.menu.separator,
            .{
                .label = "Toggle Developer Tools",
                .accelerator = "CmdOrCtrl+Shift+I",
                .run = .{
                    .standard = .@"toggle-devtools",
                },
            },
        },
    },
};
