//
// The pick-repo-folder message and task: show the system folder picker so the user can choose the
// repo to open, and give the frontend the folder chosen.
//

const std = @import("std");
const ziggy = @import("ziggy");

const assert = std.debug.assert;
const HandlerServices = ziggy.core.HandlerServices;
const TaskContext = ziggy.task_runner.TaskContext;
const TaskServices = ziggy.task_runner.TaskServices;
const Timers = ziggy.timers.Timers;

//
// The data of the pick-repo-folder message. The backend sets every option of the folder picker, so
// the frontend sends null.
//
pub const PickRepoFolderRequest = struct {};

//
// Handles the frontend's pick-repo-folder message by queuing the pick-repo-folder task, whose
// result is the message response. The picker waits for the user, so it runs in a task and the
// thread that handles the frontend's messages is never held up.
//
pub fn pick_repo_folder_message_handler(
    services: HandlerServices,
    timers: Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    payload: PickRepoFolderRequest,
) !ziggy.core.Response(?[]const u8) {
    _ = services;
    _ = timers;
    _ = io;
    _ = payload;
    return .{
        .task = .{
            .task_type = "pick-repo-folder",
            .data = try allocator.dupe(u8, "null"),
        },
    };
}

//
// Shows the system folder picker through Ziggy's folder dialog native call and returns the folder
// the user chose, or null when they cancelled. The frontend opens the folder it returns. Data
// other than null fails the task with error.InvalidPickRepoFolderRequest and text that names the
// fix, sending null, because the data comes from the frontend and a crash would end the backend.
//
pub fn pick_repo_folder_task_handler(
    services: TaskServices,
    timers: Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    context: TaskContext,
    payload: std.json.Value,
) !?[]const u8 {
    assert(context.task_id.len > 0);
    if (payload != .null) {
        services.fail_with("The folder picker task was given data. Send null, because " ++
            "Graft sets every option of the folder picker.");
        return error.InvalidPickRepoFolderRequest;
    }
    assert(payload == .null);

    const picked_json = try services.pickPaths(io, allocator, timers, .folder, "Open repo", null);
    return try first_picked_path(allocator, picked_json);
}

//
// Reads the first path of the JSON array of paths a dialog returns, or null when the array is
// empty because the user cancelled. A folder picker chooses one folder, so the array holds at most
// one path.
//
pub fn first_picked_path(allocator: std.mem.Allocator, picked_json: []const u8) !?[]const u8 {
    assert(picked_json.len > 0);

    const paths = try std.json.parseFromSliceLeaky([]const []const u8, allocator, picked_json, .{
        .allocate = .alloc_always,
    });
    if (paths.len == 0) {
        return null;
    }
    assert(paths[0].len > 0);
    return paths[0];
}
