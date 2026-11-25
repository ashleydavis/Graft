//
// The `branch` wrapper: reads a repo's local branches through the Git interface function and
// parses them, for the repo details pane's Branches list.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("git-interface.zig");

const assert = std.debug.assert;
const TaskServices = ziggy.task_runner.TaskServices;

//
// The prefix git puts before the name of every local branch in its full ref name. The wrapper
// lists only the refs under it and takes it off each one to leave the branch's name.
//
pub const local_branch_prefix = "refs/heads/";

//
// The arguments `read_branches` starts git with after `-C <repo>`: `git for-each-ref` over the
// refs under `refs/heads/`, sorted by name, writing for each one whether HEAD points at it (`*` or
// a space), a space and its full ref name on a line of its own. It is public so the unit tests of
// the Git interface function can run it against a real repo.
//
pub const read_branches_args: []const []const u8 = &.{
    "for-each-ref",
    "--sort=refname",
    "--format=%(HEAD) %(refname)",
    local_branch_prefix,
};

//
// One local branch. The field names are camelCase because the struct is turned into the JSON the
// frontend reads, and the frontend's names are camelCase.
//
pub const Branch = struct {
    //
    // The branch's name, as in "main" or "feature/x".
    //
    name: []const u8,

    //
    // Whether the branch is checked out, so HEAD points at it.
    //
    isCheckedOut: bool,
};

//
// A repo's local branches, in the order of their names.
//
pub const Branches = struct {
    //
    // The branches. A repo with no commits has none.
    //
    branches: []const Branch,
};

//
// Reads the repo's local branches by running `read_branches_args` through `run_git`. Git refuses
// branch names with a space or a control character in them, so a line holds one branch. The help
// panel shows the command as it runs, which prints the same lines in a terminal. The list and its
// strings are allocated with the allocator, so the caller passes an arena. When git fails, what it
// wrote goes to the task's log and the function returns error.GitBranchFailed.
//
pub fn read_branches(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    repo_path: []const u8,
) !Branches {
    if (repo_path.len == 0) {
        services.fail_with("The repo path is empty. Give the path of the repo to read.");
        return error.InvalidRepoPath;
    }
    assert(repo_path.len > 0);

    const result = try run_git(io, services, allocator, .{
        .repo_path = repo_path,
        .args = read_branches_args,
    });
    if (result.exit_code != 0) {
        services.log.tool("git", .{
            .stdout = result.stdout,
            .stderr = result.stderr,
        });
        services.log.err("git for-each-ref exited with an error, so the branches could not be " ++
            "read.");
        services.fail_with("Running git for-each-ref failed, so the repo's branches could not " ++
            "be read. Check that the folder is a Git repo. Git's output is in Graft's log.");
        return error.GitBranchFailed;
    }
    assert(result.exit_code.? == 0);
    const branches = parse_branch_output(allocator, result.stdout) catch |err| {
        if (err == error.UnexpectedGitBranchOutput) {
            services.fail_with("Git for-each-ref wrote output Graft could not read, so the " ++
                "repo's branches could not be read. Check that the git on PATH is a standard git.");
        }
        return err;
    };
    return .{
        .branches = branches,
    };
}

//
// Parses the output of `read_branches`'s `git for-each-ref` into branches: one line per branch,
// each `*` for the checked-out branch or a space for any other, a space and the full ref name, and
// each ended by a newline.
//
pub fn parse_branch_output(allocator: std.mem.Allocator, output: []const u8) ![]const Branch {
    if (output.len > 0) {
        if (output[output.len - 1] != '\n') {
            return error.UnexpectedGitBranchOutput;
        }
    }

    const line_count = std.mem.count(u8, output, "\n");
    const branches = try allocator.alloc(Branch, line_count);
    errdefer allocator.free(branches);

    var lines = std.mem.splitScalar(u8, output, '\n');
    for (branches) |*branch| {
        branch.* = try parse_branch_line(lines.next().?);
    }
    assert(lines.rest().len == 0);
    assert(branches.len == line_count);
    return branches;
}

//
// Parses one line of `git for-each-ref`'s output into a branch, its name pointing into the line.
//
pub fn parse_branch_line(line: []const u8) !Branch {
    //
    // The `*` or space that marks whether HEAD points at the branch, then the space after it.
    //
    const head_length = 2;
    if (line.len <= head_length + local_branch_prefix.len) {
        return error.UnexpectedGitBranchOutput;
    }
    if (line[1] != ' ') {
        return error.UnexpectedGitBranchOutput;
    }
    const ref_name = line[head_length..];
    if (!std.mem.startsWith(u8, ref_name, local_branch_prefix)) {
        return error.UnexpectedGitBranchOutput;
    }
    var is_checked_out = false;
    if (line[0] == '*') {
        is_checked_out = true;
    } else {
        if (line[0] != ' ') {
            return error.UnexpectedGitBranchOutput;
        }
    }
    const name = ref_name[local_branch_prefix.len..];
    assert(name.len > 0);
    assert(name.len + local_branch_prefix.len + head_length == line.len);
    return .{
        .name = name,
        .isCheckedOut = is_checked_out,
    };
}

//
// Whether the name is one of the branches, so a branch name from the frontend is passed to git
// only when git itself listed it.
//
pub fn is_listed_branch(branches: Branches, name: []const u8) bool {
    if (name.len == 0) {
        return false;
    }
    assert(name.len > 0);
    for (branches.branches) |branch| {
        if (std.mem.eql(u8, branch.name, name)) {
            return true;
        }
    }
    return false;
}
