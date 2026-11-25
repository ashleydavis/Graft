//
// The open file feature's declarations to Ziggy: the tasks the file path menu queues to show a file
// of the open repo in the platform's file manager and to open it in the user's editor. app.zig
// builds Graft's list of tasks from them.
//

const builtin = @import("builtin");
const open_file = @import("../lib/open-file.zig");
const start_program = @import("../lib/start-program.zig");

//
// The file path menu's tasks, each run with the real program starter on the operating system
// Graft is built for.
//
pub const tasks = .{
    .@"show-file-in-file-manager" = open_file.open_file_task_handler(
        start_program.start_program,
        .file_manager,
        builtin.os.tag,
    ),
    .@"open-file-in-editor" = open_file.open_file_task_handler(
        start_program.start_program,
        .editor,
        builtin.os.tag,
    ),
};
