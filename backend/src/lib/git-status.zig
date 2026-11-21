//
// The `status` wrapper: reads the working tree's changes through the Git interface function, as
// the files whose changes are staged for the next commit and the files whose changes are not, for
// the changes pane.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("git-interface.zig");

const assert = std.debug.assert;
const TaskServices = ziggy.task_runner.TaskServices;

//
// One file in the staged list or the unstaged list. The field names are camelCase because the
// struct is turned into the JSON the frontend reads and the frontend's names are camelCase.
//
pub const WorkingFile = struct {
    //
    // How the file changed, as git's one letter status in that list: A (added), D (deleted),
    // M (modified), T (its type changed), ? (untracked, new to git) or U (unmerged, in conflict).
    //
    status: []const u8,

    //
    // The file's path from the root of the repo.
    //
    path: []const u8,
};

//
// The working tree's changes: the files with staged changes and the files with unstaged changes.
// A file with both is in both lists.
//
pub const WorkingChanges = struct {
    //
    // The files whose changes are not staged, untracked and unmerged files among them, in the
    // order git lists them.
    //
    unstaged: []const WorkingFile,

    //
    // The files whose changes are staged for the next commit, in the order git lists them.
    //
    staged: []const WorkingFile,
};

//
// Reads the working tree's changes by running `git status --porcelain=v1 -z` through `run_git`,
// listing every untracked file (`--untracked-files=all`) so a new file in a new directory shows as
// itself, and with rename detection off (`--no-renames`) so a renamed file shows as a deleted file
// and a new one, each staged and unstaged on its own. The lists and their strings are allocated
// with the allocator, so the caller passes an arena. When git fails, what it wrote goes to the
// task's log and the function returns error.GitStatusFailed. The help panel shows the command
// without `-z`, so git lists one file to a line.
//
pub fn read_working_changes(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    run_git: git_interface.RunGit,
    repo_path: []const u8,
) !WorkingChanges {
    assert(repo_path.len > 0);

    const result = try run_git(io, services, allocator, .{
        .repo_path = repo_path,
        .args = &.{
            "status",
            "--porcelain=v1",
            "-z",
            "--untracked-files=all",
            "--no-renames",
        },
    });
    if (result.exit_code != 0) {
        services.log.tool("git", .{
            .stdout = result.stdout,
            .stderr = result.stderr,
        });
        services.log.err("git status exited with an error, so the changes could not be read.");
        services.fail_with("Running git status failed, so the repo's changes could not be " ++
            "read. Check that the folder is a Git repo. Git's output is in Graft's log.");
        return error.GitStatusFailed;
    }
    assert(result.exit_code.? == 0);
    return parse_status_output(allocator, result.stdout) catch |err| {
        if (err == error.UnexpectedGitStatusOutput) {
            services.fail_with("Git status wrote output Graft could not read, so the repo's " ++
                "changes could not be read. Check that the git on PATH is a standard git.");
        }
        return err;
    };
}

//
// Parses the output of `git status --porcelain=v1 -z --no-renames` into the staged and unstaged
// lists. git writes each file as two status letters, a space and its path, ended by a NUL. The
// first letter is the change staged in the index and the second the change in the working tree,
// with a space for no change and "??" for an untracked file. A file in conflict, with a U in
// either letter or both letters A or both D, goes to the unstaged list alone with the status U,
// because its conflict has to be resolved in the working tree before it can be staged.
//
pub fn parse_status_output(allocator: std.mem.Allocator, output: []const u8) !WorkingChanges {
    if (output.len > 0) {
        if (output[output.len - 1] != 0) {
            return error.UnexpectedGitStatusOutput;
        }
    }

    var unstaged: std.ArrayList(WorkingFile) = .empty;
    defer unstaged.deinit(allocator);

    var staged: std.ArrayList(WorkingFile) = .empty;
    defer staged.deinit(allocator);

    const entry_count = std.mem.count(u8, output, &.{0});
    var entries = std.mem.splitScalar(u8, output, 0);
    for (0..entry_count) |_| {
        const entry = entries.next().?;
        if (entry.len < 4) {
            return error.UnexpectedGitStatusOutput;
        }
        if (entry[2] != ' ') {
            return error.UnexpectedGitStatusOutput;
        }
        const index_status = entry[0..1];
        const tree_status = entry[1..2];
        const path = entry[3..];
        if (is_unmerged(entry[0], entry[1])) {
            try unstaged.append(allocator, .{
                .status = "U",
                .path = path,
            });
        } else {
            if (index_status[0] != ' ') {
                if (index_status[0] != '?') {
                    try staged.append(allocator, .{
                        .status = index_status,
                        .path = path,
                    });
                }
            }
            if (tree_status[0] != ' ') {
                try unstaged.append(allocator, .{
                    .status = tree_status,
                    .path = path,
                });
            }
        }
    }
    assert(entries.rest().len == 0);
    assert(unstaged.items.len <= entry_count);
    assert(staged.items.len <= entry_count);

    const unstaged_files = try unstaged.toOwnedSlice(allocator);
    errdefer allocator.free(unstaged_files);

    return .{
        .unstaged = unstaged_files,
        .staged = try staged.toOwnedSlice(allocator),
    };
}

//
// Whether git's two status letters mark a file in conflict: a U in either letter, or both letters
// A (added by both sides) or both D (deleted by both sides), as `git status --porcelain` documents
// its unmerged states.
//
pub fn is_unmerged(index_status: u8, tree_status: u8) bool {
    if (index_status == 'U') {
        return true;
    }
    if (tree_status == 'U') {
        return true;
    }
    if (index_status == tree_status) {
        return index_status == 'A' or index_status == 'D';
    }
    return false;
}
