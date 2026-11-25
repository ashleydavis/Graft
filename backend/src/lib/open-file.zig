//
// The open file tasks: the background tasks that show a file of the open repo in the platform's
// file manager or open it in the user's editor, for the file path menu's open items. Each starts
// its program through the program starter.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("git-interface.zig");
const repo_file_path = @import("repo-file-path.zig");
const start_program_lib = @import("start-program.zig");

const assert = std.debug.assert;
const StartProgram = start_program_lib.StartProgram;
const TaskContext = ziggy.task_runner.TaskContext;
const TaskServices = ziggy.task_runner.TaskServices;
const Timers = ziggy.timers.Timers;

//
// The data the frontend queues an open file task with. The field names are camelCase because they
// are the JSON the frontend sends and the frontend's names are camelCase.
//
pub const OpenFileTaskRequest = struct {
    //
    // The path of the repo the file is in.
    //
    repoPath: []const u8,

    //
    // The path of the file from the root of the repo.
    //
    path: []const u8,
};

//
// The result of an open file task: the path of the file it opened, an object so the frontend reads
// a named field.
//
pub const OpenedFile = struct {
    //
    // The path of the file from the root of the repo.
    //
    path: []const u8,
};

//
// What an open file task opens the file in: the platform's file manager, or the editor the
// `editor` setting names, which is the operating system's default app for the file when the
// setting is absent.
//
pub const OpenTarget = enum {
    file_manager,
    editor,
};

//
// A program to start and whether its exit code is read to learn whether it worked. Windows'
// `explorer` exits with 1 even when it has opened the file, so its exit code is left unread.
//
pub const ProgramCommand = struct {
    //
    // The program, then its arguments.
    //
    argv: []const []const u8,

    //
    // Whether an exit code other than zero means the program failed.
    //
    is_exit_code_checked: bool,
};

//
// What one open file task is asked to do, as open_file is given it.
//
pub const OpenFileRequest = struct {
    //
    // The request the frontend sent.
    //
    file: OpenFileTaskRequest,

    //
    // What the file is opened in.
    //
    target: OpenTarget,

    //
    // The operating system Graft runs on, which picks the commands.
    //
    os_tag: std.Target.Os.Tag,

    //
    // The `editor` setting from Graft's config file, or null when it is absent.
    //
    editor: ?[]const u8,
};

//
// The type of an open file task handler, as Ziggy calls it.
//
pub const OpenFileTaskHandler = fn (
    services: TaskServices,
    timers: Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    context: TaskContext,
    payload: OpenFileTaskRequest,
) anyerror!OpenedFile;

//
// Makes the open file task handler that opens the file in the target on the operating system,
// starting programs with `start_program`. Ziggy passes a task handler only its standard
// arguments, so the starter, the target and the operating system are chosen when the handler is
// made, as the Git interface function is for the Git tasks. The editor handler reads the `editor`
// setting from the config file each time, so a change to the setting needs no restart.
//
pub fn open_file_task_handler(
    comptime start_program: StartProgram,
    comptime target: OpenTarget,
    comptime os_tag: std.Target.Os.Tag,
) OpenFileTaskHandler {
    return struct {
        //
        // Opens the file the payload names.
        //
        fn open_file_task_handler_run(
            services: TaskServices,
            timers: Timers,
            io: std.Io,
            allocator: std.mem.Allocator,
            context: TaskContext,
            payload: OpenFileTaskRequest,
        ) anyerror!OpenedFile {
            _ = timers;
            assert(context.task_id.len > 0);

            var editor: ?[]const u8 = null;
            if (target == .editor) {
                editor = try read_editor_setting(io, services, allocator, context.config_path);
            }
            try open_file(io, services, allocator, start_program, .{
                .file = payload,
                .target = target,
                .os_tag = os_tag,
                .editor = editor,
            });
            assert(payload.path.len > 0);
            return .{
                .path = payload.path,
            };
        }
    }.open_file_task_handler_run;
}

//
// Reads the `editor` setting from the config file at the path, or null when it is absent. A
// config file that cannot be read fails the task with text that names the file, so the user can
// fix it.
//
pub fn read_editor_setting(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    config_path: []const u8,
) !?[]const u8 {
    assert(config_path.len > 0);

    const editor = ziggy.config_state.config.get(
        ?[]const u8,
        allocator,
        io,
        config_path,
        "editor",
    ) catch |err| {
        services.fail_with(try std.fmt.allocPrint(
            allocator,
            "Graft could not read the editor setting from its config file {s} ({s}), so the " ++
                "file was not opened. Set editor to a command, such as \"code\", or remove it.",
            .{
                config_path,
                @errorName(err),
            },
        ));
        return err;
    };
    return editor;
}

//
// Opens the file in the target: checks the path is inside the repo and the file is in the working
// tree, builds the command for the target and starts it. Each failure fails the task with text that
// gives the reason, and a program that could not start or that failed is named by its command line.
//
pub fn open_file(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    start_program: StartProgram,
    request: OpenFileRequest,
) !void {
    if (request.file.repoPath.len == 0) {
        services.fail_with("The open file task got no repo path, so no file was opened. Give " ++
            "the path of the open repo.");
        return error.InvalidRepoPath;
    }
    if (!repo_file_path.is_repo_file_path(request.file.path)) {
        services.fail_with("The open file task got a path that is empty or outside the repo, " ++
            "so no file was opened. Give the path of a file from the repo's root.");
        return error.InvalidFilePath;
    }
    assert(request.file.path.len > 0);

    const full_path = try full_file_path(allocator, request.os_tag, request.file);
    std.Io.Dir.cwd().access(io, full_path, .{}) catch |err| {
        services.fail_with(try std.fmt.allocPrint(
            allocator,
            "Graft could not open {s} because it is not in the working tree ({s}). It may " ++
                "have been deleted, moved or renamed since the list was read.",
            .{
                full_path,
                @errorName(err),
            },
        ));
        return error.FileMissing;
    };

    const command = try program_command(allocator, request, full_path);
    assert(command.argv.len > 0);
    try run_program_command(io, services, allocator, start_program, command);
}

//
// Picks the command that opens the full path in the request's target: the file manager command,
// the command the `editor` setting names or, with no setting, the default app command.
//
pub fn program_command(
    allocator: std.mem.Allocator,
    request: OpenFileRequest,
    full_path: []const u8,
) !ProgramCommand {
    assert(full_path.len > 0);

    if (request.target == .file_manager) {
        return try file_manager_command(allocator, request.os_tag, full_path);
    }
    assert(request.target == .editor);
    if (request.editor) |editor| {
        if (std.mem.trim(u8, editor, &std.ascii.whitespace).len > 0) {
            return .{
                .argv = try editor_command(allocator, .{
                    .editor = editor,
                    .full_path = full_path,
                }),
                .is_exit_code_checked = true,
            };
        }
    }
    return try default_app_command(allocator, request.os_tag, full_path);
}

//
// Starts the command with the starter. A program that could not start, or that exited with an
// error when its exit code is checked, fails the task with text naming its command line and, for
// an exit, what it wrote to its standard error.
//
pub fn run_program_command(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    start_program: StartProgram,
    command: ProgramCommand,
) !void {
    assert(command.argv.len > 0);

    const command_line = try git_interface.format_command_line(allocator, command.argv);
    assert(command_line.len > 0);
    const result = start_program(io, allocator, command.argv) catch |err| {
        services.fail_with(try std.fmt.allocPrint(
            allocator,
            "Graft could not start `{s}` ({s}). Check that {s} is installed and on the PATH.",
            .{
                command_line,
                @errorName(err),
                command.argv[0],
            },
        ));
        return error.ProgramStartFailed;
    };
    if (!command.is_exit_code_checked) {
        return;
    }
    if (result.exit_code == 0) {
        return;
    }
    services.fail_with(try program_failure_text(allocator, command_line, result));
    return error.ProgramFailed;
}

//
// Builds the text the frontend is sent when a started program fails: its command line, how it
// ended and what it wrote to its standard error, so the user reads the program's own reason.
//
pub fn program_failure_text(
    allocator: std.mem.Allocator,
    command_line: []const u8,
    result: start_program_lib.ProgramResult,
) ![]const u8 {
    assert(command_line.len > 0);

    const output = std.mem.trim(u8, result.stderr, &std.ascii.whitespace);
    var ending: []const u8 = "ended without exiting";
    if (result.exit_code) |exit_code| {
        ending = try std.fmt.allocPrint(allocator, "exited with code {d}", .{exit_code});
    }
    if (output.len == 0) {
        return try std.fmt.allocPrint(allocator, "`{s}` {s} and gave no reason.", .{
            command_line,
            ending,
        });
    }
    const text = try std.fmt.allocPrint(allocator, "`{s}` {s}:\n{s}", .{
        command_line,
        ending,
        output,
    });
    assert(text.len > output.len);
    return text;
}

//
// Joins the repo's path and the file's path from the repo's root into the file's full path, with
// the platform's separator: `\` on Windows, whose `explorer` reads only that, and `/` elsewhere.
//
pub fn full_file_path(
    allocator: std.mem.Allocator,
    os_tag: std.Target.Os.Tag,
    file: OpenFileTaskRequest,
) ![]const u8 {
    assert(file.repoPath.len > 0);
    assert(file.path.len > 0);

    var separator: u8 = '/';
    if (os_tag == .windows) {
        separator = '\\';
    }
    const repo_path = std.mem.trimEnd(u8, file.repoPath, "/\\");
    const full_path = try std.fmt.allocPrint(allocator, "{s}{c}{s}", .{
        repo_path,
        separator,
        file.path,
    });
    if (os_tag == .windows) {
        std.mem.replaceScalar(u8, full_path, '/', '\\');
    }
    assert(full_path.len > file.path.len);
    return full_path;
}

//
// Builds the command that shows the file in the platform's file manager: Finder with the file
// selected on macOS (`open -R`), Explorer with the file selected on Windows (`explorer /select,`)
// and the file manager on the file's directory on Linux (`xdg-open`), which has no common way to
// select a file.
//
pub fn file_manager_command(
    allocator: std.mem.Allocator,
    os_tag: std.Target.Os.Tag,
    full_path: []const u8,
) !ProgramCommand {
    assert(full_path.len > 0);

    var argv: []const []const u8 = undefined;
    var is_exit_code_checked = true;
    switch (os_tag) {
        .macos => {
            argv = try allocator.dupe([]const u8, &.{
                "open",
                "-R",
                full_path,
            });
        },
        .windows => {
            argv = try allocator.dupe([]const u8, &.{
                "explorer",
                try std.fmt.allocPrint(allocator, "/select,{s}", .{full_path}),
            });
            is_exit_code_checked = false;
        },
        else => {
            argv = try allocator.dupe([]const u8, &.{
                "xdg-open",
                std.fs.path.dirnamePosix(full_path) orelse "/",
            });
        },
    }
    assert(argv.len >= 2);
    return .{
        .argv = argv,
        .is_exit_code_checked = is_exit_code_checked,
    };
}

//
// Builds the command that opens the file with the operating system's default app for its type:
// `open` on macOS, `explorer` on Windows and `xdg-open` on Linux. `explorer`'s exit code is left
// unread, as for the file manager command.
//
pub fn default_app_command(
    allocator: std.mem.Allocator,
    os_tag: std.Target.Os.Tag,
    full_path: []const u8,
) !ProgramCommand {
    assert(full_path.len > 0);

    var program: []const u8 = undefined;
    switch (os_tag) {
        .macos => {
            program = "open";
        },
        .windows => {
            program = "explorer";
        },
        else => {
            program = "xdg-open";
        },
    }
    const argv = try allocator.dupe([]const u8, &.{
        program,
        full_path,
    });
    assert(argv.len == 2);
    return .{
        .argv = argv,
        .is_exit_code_checked = os_tag != .windows,
    };
}

//
// What editor_command builds its command from. Both are text, so a struct keeps a caller from
// passing them in the wrong order.
//
pub const EditorCommandRequest = struct {
    //
    // The `editor` setting: the program, then its arguments, separated by spaces or tabs.
    //
    editor: []const u8,

    //
    // The file's full path, which the command takes as its last argument.
    //
    full_path: []const u8,
};

//
// Splits the `editor` setting at its spaces and tabs into the program and its arguments, and adds
// the file's full path as the last argument, so a setting such as `code --reuse-window` opens the
// file in the window already open.
//
pub fn editor_command(
    allocator: std.mem.Allocator,
    request: EditorCommandRequest,
) ![]const []const u8 {
    assert(request.full_path.len > 0);

    var words: std.ArrayList([]const u8) = .empty;
    errdefer words.deinit(allocator);

    var parts = std.mem.tokenizeAny(u8, request.editor, " \t");
    while (parts.next()) |part| {
        try words.append(allocator, part);
    }
    assert(words.items.len > 0);
    try words.append(allocator, request.full_path);
    return try words.toOwnedSlice(allocator);
}
