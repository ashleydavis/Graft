//
// The stage file and unstage file tasks: the background tasks that stage or unstage one whole file
// with the `add` and `restore --staged` wrappers, for the changes pane's stage and unstage buttons.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("git-interface.zig");
const git_stage = @import("git-stage.zig");

const assert = std.debug.assert;
const TaskContext = ziggy.task_runner.TaskContext;
const TaskServices = ziggy.task_runner.TaskServices;
const Timers = ziggy.timers.Timers;

//
// The data the frontend queues the stage file or unstage file task with. The field names are
// camelCase because they are the JSON the frontend sends and the frontend's names are camelCase.
//
pub const StageFileTaskRequest = struct {
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
// The result of the stage file and unstage file tasks: the path of the file, an object so the
// frontend reads a named field and knows which file the task changed.
//
pub const StagedFile = struct {
    //
    // The path of the file the task staged or unstaged.
    //
    path: []const u8,
};

//
// The type of a stage file or unstage file task handler, as Ziggy calls it.
//
pub const StageFileTaskHandler = fn (
    services: TaskServices,
    timers: Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    context: TaskContext,
    payload: StageFileTaskRequest,
) anyerror!StagedFile;

//
// Makes the stage file task handler that runs Git with `run_git`. Ziggy passes a task handler only
// its standard arguments, so the Git interface function is chosen when the handler is made, as for
// the commits task.
//
pub fn stage_file_task_handler(comptime run_git: git_interface.RunGit) StageFileTaskHandler {
    return struct {
        //
        // Stages the file the payload names.
        //
        fn stage_file_task_handler_run(
            services: TaskServices,
            timers: Timers,
            io: std.Io,
            allocator: std.mem.Allocator,
            context: TaskContext,
            payload: StageFileTaskRequest,
        ) anyerror!StagedFile {
            _ = timers;
            assert(context.task_id.len > 0);

            try git_stage.stage_file(io, services, allocator, run_git, .{
                .repo_path = payload.repoPath,
                .path = payload.path,
            });
            assert(payload.path.len > 0);
            return .{
                .path = payload.path,
            };
        }
    }.stage_file_task_handler_run;
}

//
// Makes the unstage file task handler that runs Git with `run_git`, as stage_file_task_handler
// makes the stage file task handler.
//
pub fn unstage_file_task_handler(comptime run_git: git_interface.RunGit) StageFileTaskHandler {
    return struct {
        //
        // Unstages the file the payload names.
        //
        fn unstage_file_task_handler_run(
            services: TaskServices,
            timers: Timers,
            io: std.Io,
            allocator: std.mem.Allocator,
            context: TaskContext,
            payload: StageFileTaskRequest,
        ) anyerror!StagedFile {
            _ = timers;
            assert(context.task_id.len > 0);

            try git_stage.unstage_file(io, services, allocator, run_git, .{
                .repo_path = payload.repoPath,
                .path = payload.path,
            });
            assert(payload.path.len > 0);
            return .{
                .path = payload.path,
            };
        }
    }.unstage_file_task_handler_run;
}
