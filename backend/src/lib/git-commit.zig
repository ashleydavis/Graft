//
// The `commit` wrapper: commits the staged files with the user's message through the Git interface
// function, for the changes pane's Commit button.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("git-interface.zig");

const assert = std.debug.assert;
const TaskServices = ziggy.task_runner.TaskServices;

//
// What to commit: the repo and the commit message, in a struct because both are text and could be
// mixed up.
//
pub const CommitRequest = struct {
    //
    // The path of the repo whose staged files are committed.
    //
    repo_path: []const u8,

    //
    // The commit message as the user wrote it.
    //
    message: []const u8,
};

//
// Commits the staged files by running `git commit --message <message>` through `run_git`. The
// message is one argument of its own, so git takes it as it is, whatever characters it holds. A
// message with only white space is refused before git starts, as git would refuse it. When git
// fails, such as when a hook refuses the commit, what it wrote goes to the task's log and the text
// the frontend is sent holds git's own error text, allocated with the allocator, so the user sees
// why. The function then returns error.GitCommitFailed. Every other error it returns, such as git
// failing to start or an allocation failing, reaches the user as text of its own, in place of
// the error's bare name.
//
pub fn commit(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    request: CommitRequest,
) !void {
    assert(request.repo_path.len > 0);
    if (std.mem.trim(u8, request.message, &std.ascii.whitespace).len == 0) {
        services.fail_with("The commit task got an empty commit message, so no commit was " ++
            "made. Write a message and commit again.");
        return error.EmptyCommitMessage;
    }
    assert(request.message.len > 0);

    const args: []const []const u8 = &.{
        "commit",
        "--message",
        request.message,
    };
    const result = run_git(io, services, allocator, .{
        .repo_path = request.repo_path,
        .args = args,
    }) catch |err| {
        services.fail_with("Graft could not run git commit. Check that git is installed and " ++
            "on the PATH, then check the commit pane for the commit before committing again.");
        return err;
    };
    if (result.exit_code != 0) {
        services.log.tool("git", .{
            .stdout = result.stdout,
            .stderr = result.stderr,
        });
        services.log.err("git commit exited with an error, so no commit was made.");
        const text = commit_failure_text(allocator, result) catch |err| {
            services.fail_with("Git did not make the commit. Graft's log has git's output.");
            return err;
        };
        services.fail_with(text);
        return error.GitCommitFailed;
    }
    assert(result.exit_code.? == 0);
}

//
// Builds the text the frontend is sent when git commit fails: that no commit was made, then what
// git wrote, so the user reads git's own reason, such as a hook's output. Git writes its errors and
// a hook's output to its standard error, but writes "nothing to commit" to its standard output, so
// the text takes the standard error and falls back to the standard output when the standard error
// is empty. The text is allocated with the allocator.
//
pub fn commit_failure_text(
    allocator: std.mem.Allocator,
    result: git_interface.GitResult,
) ![]const u8 {
    var output = std.mem.trim(u8, result.stderr, &std.ascii.whitespace);
    if (output.len == 0) {
        output = std.mem.trim(u8, result.stdout, &std.ascii.whitespace);
    }
    if (output.len == 0) {
        return "Git did not make the commit and gave no reason. Graft's log has the details.";
    }
    const text = try std.fmt.allocPrint(allocator, "Git did not make the commit:\n{s}", .{output});
    assert(text.len > output.len);
    return text;
}
