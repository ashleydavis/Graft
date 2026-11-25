//
// Tests the open file tasks: the commands that show a file in each platform's file manager and
// open it in the editor or the default app, what the task does when the file is missing or the
// program fails, and the tasks the way the frontend runs them, through Ziggy's fake native app,
// each with a mock of the program starter.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_mock = @import("git-mock.zig");
const open_file = @import("../lib/open-file.zig");
const program_mock = @import("program-mock.zig");
const start_program = @import("../lib/start-program.zig");
const test_environment = @import("test-environment.zig");

const io = std.testing.io;
const FakeNativeApp = ziggy.fake_native_app.FakeNativeApp;

//
// Checks the arguments are the expected ones, in the same order.
//
fn expect_argv(expected: []const []const u8, argv: []const []const u8) !void {
    try std.testing.expectEqual(expected.len, argv.len);
    for (expected, argv) |expected_arg, arg| {
        try std.testing.expectEqualStrings(expected_arg, arg);
    }
}

test "the file manager command opens the file's directory with xdg-open on Linux" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    const command = try open_file.file_manager_command(
        arena.allocator(),
        .linux,
        "/repo/docs/a.md",
    );
    try expect_argv(&.{
        "xdg-open",
        "/repo/docs",
    }, command.argv);
    try std.testing.expect(command.is_exit_code_checked);
}

test "the file manager command opens the root for a file at the root on Linux" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    const command = try open_file.file_manager_command(arena.allocator(), .linux, "a.md");
    try expect_argv(&.{
        "xdg-open",
        "/",
    }, command.argv);
}

test "the file manager command reveals the file in Finder with open -R on macOS" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    const command = try open_file.file_manager_command(arena.allocator(), .macos, "/repo/a.md");
    try expect_argv(&.{
        "open",
        "-R",
        "/repo/a.md",
    }, command.argv);
    try std.testing.expect(command.is_exit_code_checked);
}

test "the file manager command selects the file in Explorer on Windows" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    const command = try open_file.file_manager_command(
        arena.allocator(),
        .windows,
        "C:\\repo\\a.md",
    );
    try expect_argv(&.{
        "explorer",
        "/select,C:\\repo\\a.md",
    }, command.argv);
    try std.testing.expect(!command.is_exit_code_checked);
}

test "the default app command opens the file with xdg-open on Linux" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    const command = try open_file.default_app_command(arena.allocator(), .linux, "/repo/a.md");
    try expect_argv(&.{
        "xdg-open",
        "/repo/a.md",
    }, command.argv);
    try std.testing.expect(command.is_exit_code_checked);
}

test "the default app command opens the file with open on macOS" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    const command = try open_file.default_app_command(arena.allocator(), .macos, "/repo/a.md");
    try expect_argv(&.{
        "open",
        "/repo/a.md",
    }, command.argv);
    try std.testing.expect(command.is_exit_code_checked);
}

test "the default app command opens the file with explorer on Windows" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    const command = try open_file.default_app_command(
        arena.allocator(),
        .windows,
        "C:\\repo\\a.md",
    );
    try expect_argv(&.{
        "explorer",
        "C:\\repo\\a.md",
    }, command.argv);
    try std.testing.expect(!command.is_exit_code_checked);
}

test "the editor command splits the setting at spaces and tabs and adds the full path" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    const argv = try open_file.editor_command(arena.allocator(), .{
        .editor = "  code --reuse-window\t-g ",
        .full_path = "/repo/a.md",
    });
    try expect_argv(&.{
        "code",
        "--reuse-window",
        "-g",
        "/repo/a.md",
    }, argv);
}

test "the editor command frees what it built when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, free_editor_command, .{});
}

//
// Builds an editor command and frees it, for the allocation failure test.
//
fn free_editor_command(allocator: std.mem.Allocator) !void {
    const argv = try open_file.editor_command(allocator, .{
        .editor = "code --wait",
        .full_path = "/repo/a.md",
    });
    allocator.free(argv);
}

test "the full file path joins the repo's path and the file's path with / off Windows" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    const full_path = try open_file.full_file_path(arena.allocator(), .linux, .{
        .repoPath = "/repos/graft/",
        .path = "docs/a.md",
    });
    try std.testing.expectEqualStrings("/repos/graft/docs/a.md", full_path);
}

test "the full file path uses \\ on Windows" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    const full_path = try open_file.full_file_path(arena.allocator(), .windows, .{
        .repoPath = "C:\\repos\\graft",
        .path = "docs/a.md",
    });
    try std.testing.expectEqualStrings("C:\\repos\\graft\\docs\\a.md", full_path);
}

test "the failure text names the command, its exit code and what it wrote" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    const text = try open_file.program_failure_text(arena.allocator(), "xdg-open /repo", .{
        .exit_code = 4,
        .stderr = "\nNo application.\n",
    });
    try std.testing.expectEqualStrings(
        "`xdg-open /repo` exited with code 4:\nNo application.",
        text,
    );
}

test "the failure text reports that the program gave no reason when it wrote no error text" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    const text = try open_file.program_failure_text(arena.allocator(), "open /repo/a.md", .{
        .exit_code = null,
        .stderr = "  ",
    });
    try std.testing.expectEqualStrings(
        "`open /repo/a.md` ended without exiting and gave no reason.",
        text,
    );
}

//
// A temporary repo directory holding notes.txt, for the tests that open a file that exists.
//
const TestRepo = struct {
    // The temporary directory.
    tmp: std.testing.TmpDir,

    // The directory's full path, allocated with the test allocator.
    path: [:0]const u8,
};

//
// Makes a temporary directory with notes.txt in it. The caller frees it with free_test_repo.
//
fn make_test_repo() !TestRepo {
    var tmp = std.testing.tmpDir(.{});
    errdefer tmp.cleanup();

    try tmp.dir.writeFile(io, .{
        .sub_path = "notes.txt",
        .data = "A note.\n",
    });
    const path = try tmp.dir.realPathFileAlloc(io, ".", std.testing.allocator);
    return .{
        .tmp = tmp,
        .path = path,
    };
}

//
// Frees the temporary directory make_test_repo made.
//
fn free_test_repo(repo: *TestRepo) void {
    std.testing.allocator.free(repo.path);
    repo.tmp.cleanup();
}

//
// Runs open_file for notes.txt in the test repo with the starter, the target and the editor
// setting on Linux, and returns how it ended with the text the task would be sent in `failure`.
//
fn run_open_file(
    arena: std.mem.Allocator,
    repo_path: []const u8,
    path: []const u8,
    comptime starter: start_program.StartProgram,
    target: open_file.OpenTarget,
    editor: ?[]const u8,
    failure: *?[]const u8,
) !void {
    var task = git_mock.mock_task();
    const services = git_mock.mock_services(&task);
    defer failure.* = task.failure;

    try open_file.open_file(io, services, arena, starter, .{
        .file = .{
            .repoPath = repo_path,
            .path = path,
        },
        .target = target,
        .os_tag = .linux,
        .editor = editor,
    });
}

test "open_file shows the file's directory in the file manager" {
    var repo = try make_test_repo();
    defer free_test_repo(&repo);

    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    var failure: ?[]const u8 = null;
    const starter = comptime program_mock.mock_start_program(.{
        .expected_argv = &.{
            "xdg-open",
            "*",
        },
        .exit_code = 0,
        .stderr = "",
        .start_error = null,
    });
    try run_open_file(
        arena.allocator(),
        repo.path,
        "notes.txt",
        starter,
        .file_manager,
        null,
        &failure,
    );
    try std.testing.expect(failure == null);
}

test "open_file opens the file with the editor setting's command and the full path" {
    var repo = try make_test_repo();
    defer free_test_repo(&repo);

    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    var failure: ?[]const u8 = null;
    const starter = comptime program_mock.mock_start_program(.{
        .expected_argv = &.{
            "code",
            "--reuse-window",
            "*/notes.txt",
        },
        .exit_code = 0,
        .stderr = "",
        .start_error = null,
    });
    try run_open_file(
        arena.allocator(),
        repo.path,
        "notes.txt",
        starter,
        .editor,
        "code --reuse-window",
        &failure,
    );
    try std.testing.expect(failure == null);
}

test "open_file opens the file with the default app when the editor setting is absent" {
    var repo = try make_test_repo();
    defer free_test_repo(&repo);

    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    var failure: ?[]const u8 = null;
    const starter = comptime program_mock.mock_start_program(.{
        .expected_argv = &.{
            "xdg-open",
            "*/notes.txt",
        },
        .exit_code = 0,
        .stderr = "",
        .start_error = null,
    });
    try run_open_file(
        arena.allocator(),
        repo.path,
        "notes.txt",
        starter,
        .editor,
        null,
        &failure,
    );
    try std.testing.expect(failure == null);
}

test "open_file opens the file with the default app when the editor setting is blank" {
    var repo = try make_test_repo();
    defer free_test_repo(&repo);

    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    var failure: ?[]const u8 = null;
    const starter = comptime program_mock.mock_start_program(.{
        .expected_argv = &.{
            "xdg-open",
            "*/notes.txt",
        },
        .exit_code = 0,
        .stderr = "",
        .start_error = null,
    });
    try run_open_file(
        arena.allocator(),
        repo.path,
        "notes.txt",
        starter,
        .editor,
        "  ",
        &failure,
    );
    try std.testing.expect(failure == null);
}

//
// A mock starter that fails the test when it is called, for the tests where no program may start.
//
const never_started = program_mock.mock_start_program(.{
    .expected_argv = &.{"never-started"},
    .exit_code = 0,
    .stderr = "",
    .start_error = null,
});

test "open_file fails with why when the file is not in the working tree" {
    var repo = try make_test_repo();
    defer free_test_repo(&repo);

    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    var failure: ?[]const u8 = null;
    try std.testing.expectError(error.FileMissing, run_open_file(
        arena.allocator(),
        repo.path,
        "gone.txt",
        never_started,
        .editor,
        null,
        &failure,
    ));
    const expected = "gone.txt because it is not in the working tree";
    try std.testing.expect(std.mem.indexOf(u8, failure.?, expected) != null);
}

test "open_file refuses a path outside the repo" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    var failure: ?[]const u8 = null;
    try std.testing.expectError(error.InvalidFilePath, run_open_file(
        arena.allocator(),
        "/repo",
        "../secret.txt",
        never_started,
        .file_manager,
        null,
        &failure,
    ));
    try std.testing.expect(std.mem.indexOf(u8, failure.?, "outside the repo") != null);
}

test "open_file refuses an empty repo path" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    var failure: ?[]const u8 = null;
    try std.testing.expectError(error.InvalidRepoPath, run_open_file(
        arena.allocator(),
        "",
        "notes.txt",
        never_started,
        .file_manager,
        null,
        &failure,
    ));
    try std.testing.expect(std.mem.indexOf(u8, failure.?, "no repo path") != null);
}

test "open_file names the command when the program cannot start" {
    var repo = try make_test_repo();
    defer free_test_repo(&repo);

    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    var failure: ?[]const u8 = null;
    try std.testing.expectError(error.ProgramStartFailed, run_open_file(
        arena.allocator(),
        repo.path,
        "notes.txt",
        comptime program_mock.mock_start_program(.{
            .expected_argv = &.{"unused"},
            .exit_code = 0,
            .stderr = "",
            .start_error = error.FileNotFound,
        }),
        .editor,
        "my-editor",
        &failure,
    ));
    try std.testing.expect(std.mem.startsWith(u8, failure.?, "Graft could not start `my-editor "));
    const expected = "(FileNotFound). Check that my-editor is installed";
    try std.testing.expect(std.mem.indexOf(u8, failure.?, expected) != null);
}

test "open_file names the command and what it wrote when the program fails" {
    var repo = try make_test_repo();
    defer free_test_repo(&repo);

    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    var failure: ?[]const u8 = null;
    try std.testing.expectError(error.ProgramFailed, run_open_file(
        arena.allocator(),
        repo.path,
        "notes.txt",
        comptime program_mock.mock_start_program(.{
            .expected_argv = &.{
                "xdg-open",
                "*/notes.txt",
            },
            .exit_code = 3,
            .stderr = "No application knows this file.",
            .start_error = null,
        }),
        .editor,
        null,
        &failure,
    ));
    try std.testing.expect(std.mem.startsWith(u8, failure.?, "`xdg-open "));
    const expected = "notes.txt` exited with code 3:\nNo application knows this file.";
    try std.testing.expect(std.mem.endsWith(u8, failure.?, expected));
}

test "run_program_command leaves the exit code of a command that does not check it unread" {
    var arena: std.heap.ArenaAllocator = .init(std.testing.allocator);
    defer arena.deinit();

    var task = git_mock.mock_task();
    const services = git_mock.mock_services(&task);
    const starter = comptime program_mock.mock_start_program(.{
        .expected_argv = &.{
            "explorer",
            "/select,C:\\repo\\a.md",
        },
        .exit_code = 1,
        .stderr = "",
        .start_error = null,
    });
    try open_file.run_program_command(io, services, arena.allocator(), starter, .{
        .argv = &.{
            "explorer",
            "/select,C:\\repo\\a.md",
        },
        .is_exit_code_checked = false,
    });
    try std.testing.expect(task.failure == null);
}

//
// Declares a backend whose only tasks are the open file tasks on Linux, run with the starter.
//
fn declare_app(comptime starter: start_program.StartProgram) ziggy.core.RegisteredApp {
    return ziggy.core.App(.{
        .messages = .{},
        .tasks = .{
            .@"show-file-in-file-manager" = open_file.open_file_task_handler(
                starter,
                .file_manager,
                .linux,
            ),
            .@"open-file-in-editor" = open_file.open_file_task_handler(starter, .editor, .linux),
        },
        .menu = &.{},
        .ui_files = &.{},
    });
}

//
// Starts a backend of the app with the config file holding the text, or no config file for null,
// queues the task of the type for notes.txt in a test repo and waits for the message containing
// the expected text.
//
fn expect_task_message(
    comptime starter: start_program.StartProgram,
    task_type: []const u8,
    config_text: ?[]const u8,
    expected_text: []const u8,
) !void {
    var repo = try make_test_repo();
    defer free_test_repo(&repo);

    var native_app: FakeNativeApp = undefined;
    native_app.init();
    const directories = try test_environment.useTestEnvironment(
        std.testing.allocator,
        native_app.data_tmp,
    );
    defer test_environment.freeTestEnvironment(std.testing.allocator, directories);
    defer native_app.deinit(io, std.testing.allocator);

    if (config_text) |text| {
        try native_app.data_tmp.dir.createDirPath(io, "config");
        try native_app.data_tmp.dir.writeFile(io, .{
            .sub_path = "config/config.toml",
            .data = text,
        });
    }

    try native_app.start(io, std.testing.allocator, native_app.config(2, 2), declare_app(starter));
    defer native_app.stop(io, std.testing.allocator);

    const message = try std.fmt.allocPrint(
        std.testing.allocator,
        "{{\"kind\":\"system\",\"name\":\"add-task\",\"data\":{{\"taskId\":\"t1\"," ++
            "\"taskType\":\"{s}\",\"source\":\"repo-explorer-page\"," ++
            "\"data\":{{\"repoPath\":\"{s}\",\"path\":\"notes.txt\"}}}}}}",
        .{
            task_type,
            repo.path,
        },
    );
    defer std.testing.allocator.free(message);

    try native_app.send(io, std.testing.allocator, message);
    try native_app.expectMessageContaining(io, std.testing.allocator, expected_text);
}

test "the show file in file manager task opens the directory and gives the path as its result" {
    try expect_task_message(
        comptime program_mock.mock_start_program(.{
            .expected_argv = &.{
                "xdg-open",
                "*",
            },
            .exit_code = 0,
            .stderr = "",
            .start_error = null,
        }),
        "show-file-in-file-manager",
        null,
        "\"status\":\"succeeded\",\"outputs\":{\"path\":\"notes.txt\"}",
    );
}

test "the open file in editor task runs the editor setting from the config file" {
    try expect_task_message(
        comptime program_mock.mock_start_program(.{
            .expected_argv = &.{
                "my-editor",
                "--new",
                "*/notes.txt",
            },
            .exit_code = 0,
            .stderr = "",
            .start_error = null,
        }),
        "open-file-in-editor",
        "editor = \"my-editor --new\"\n",
        "\"status\":\"succeeded\",\"outputs\":{\"path\":\"notes.txt\"}",
    );
}

test "the open file in editor task opens the default app with no config file" {
    try expect_task_message(
        comptime program_mock.mock_start_program(.{
            .expected_argv = &.{
                "xdg-open",
                "*/notes.txt",
            },
            .exit_code = 0,
            .stderr = "",
            .start_error = null,
        }),
        "open-file-in-editor",
        null,
        "\"status\":\"succeeded\",\"outputs\":{\"path\":\"notes.txt\"}",
    );
}

test "the open file in editor task fails with the config file's path when it cannot be read" {
    try expect_task_message(
        never_started,
        "open-file-in-editor",
        "editor = 5\n",
        "Graft could not read the editor setting from its config file",
    );
}

test "the open file in editor task fails with the program's reason when it fails" {
    try expect_task_message(
        comptime program_mock.mock_start_program(.{
            .expected_argv = &.{
                "my-editor",
                "*/notes.txt",
            },
            .exit_code = 2,
            .stderr = "The editor is broken.",
            .start_error = null,
        }),
        "open-file-in-editor",
        "editor = \"my-editor\"\n",
        "exited with code 2:\\nThe editor is broken.",
    );
}
