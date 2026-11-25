//
// The tag details task: the background task that reads one tag's details with the `for-each-ref`
// wrapper, for the tag pane.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_for_each_ref = @import("git-for-each-ref.zig");
const git_interface = @import("git-interface.zig");

const assert = std.debug.assert;
const TaskContext = ziggy.task_runner.TaskContext;
const TaskServices = ziggy.task_runner.TaskServices;
const Timers = ziggy.timers.Timers;

//
// The data the frontend queues the tag details task with. The field names are camelCase because
// they are the JSON the frontend sends and the frontend's names are camelCase.
//
pub const TagDetailsTaskRequest = struct {
    //
    // The path of the repo to read.
    //
    repoPath: []const u8,

    //
    // The name of the tag to read.
    //
    name: []const u8,
};

//
// The type of a tag details task handler, as Ziggy calls it.
//
pub const TagDetailsTaskHandler = fn (
    services: TaskServices,
    timers: Timers,
    io: std.Io,
    allocator: std.mem.Allocator,
    context: TaskContext,
    payload: TagDetailsTaskRequest,
) anyerror!git_for_each_ref.Tag;

//
// Makes the tag details task handler that runs Git with `run_git`. Ziggy passes a task handler
// only its standard arguments, so the Git interface function is chosen when the handler is made,
// as for the commits task.
//
pub fn tag_details_task_handler(comptime run_git: git_interface.RunGit) TagDetailsTaskHandler {
    return struct {
        //
        // Reads the repo's tag names, checks the name the frontend sent is one of them, so git is
        // given only a tag it listed, then reads that tag's details, in the task's arena.
        //
        fn tag_details_task_handler_run(
            services: TaskServices,
            timers: Timers,
            io: std.Io,
            allocator: std.mem.Allocator,
            context: TaskContext,
            payload: TagDetailsTaskRequest,
        ) anyerror!git_for_each_ref.Tag {
            _ = timers;
            assert(context.task_id.len > 0);

            const names = try git_for_each_ref.read_tag_names(
                io,
                services,
                allocator,
                run_git,
                payload.repoPath,
            );
            if (!git_for_each_ref.is_listed_tag(names, payload.name)) {
                services.fail_with("That tag is not one of the repo's tags, so its details " ++
                    "could not be read. Open the repo again to read its tags afresh.");
                return error.UnknownTag;
            }
            assert(payload.name.len > 0);

            const tag = try git_for_each_ref.read_tag(io, services, allocator, run_git, .{
                .repo_path = payload.repoPath,
                .name = payload.name,
            });
            assert(std.mem.eql(u8, tag.name, payload.name));
            return tag;
        }
    }.tag_details_task_handler_run;
}
