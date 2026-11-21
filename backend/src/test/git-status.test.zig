//
// Tests the `status` wrapper with the mock of the Git interface function in place of `git`: the
// arguments it starts git with, how it sorts git's list of changed files into the staged and
// unstaged lists, and every way git's output or git itself can fail.
//

const std = @import("std");
const git_mock = @import("git-mock.zig");
const git_status = @import("../lib/git-status.zig");

const io = std.testing.io;

//
// The arguments `read_working_changes` starts git with for the repo at "repo".
//
const status_args: []const []const u8 = &.{
    "-C",
    "repo",
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
    "--no-renames",
};

//
// The arguments the help panel is given to show for the same command.
//
const status_shown_args: []const []const u8 = &.{
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "--no-renames",
};

//
// What `git status --porcelain=v1 -z` writes for a repo with a modified file, a deleted file, an
// untracked file in a new directory, a staged new file and a file with staged and unstaged
// changes.
//
const mixed_output = " M notes.txt\x00 D old.txt\x00?? docs/new file.md\x00A  added.txt\x00" ++
    "MM both.txt\x00";

//
// Returns `mixed_output` from the mock status call.
//
const mixed_mock = git_mock.mock_git(.{
    .expected_args = status_args,
    .expected_shown_args = status_shown_args,
    .exit_code = 0,
    .stdout = mixed_output,
    .stderr = "",
    .start_error = null,
});

test "read_working_changes sorts each changed file into the staged and unstaged lists" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const changes = try git_status.read_working_changes(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mixed_mock,
        "repo",
    );
    try std.testing.expectEqual(@as(usize, 4), changes.unstaged.len);
    try std.testing.expectEqualStrings("M", changes.unstaged[0].status);
    try std.testing.expectEqualStrings("notes.txt", changes.unstaged[0].path);
    try std.testing.expectEqualStrings("D", changes.unstaged[1].status);
    try std.testing.expectEqualStrings("old.txt", changes.unstaged[1].path);
    try std.testing.expectEqualStrings("?", changes.unstaged[2].status);
    try std.testing.expectEqualStrings("docs/new file.md", changes.unstaged[2].path);
    try std.testing.expectEqualStrings("M", changes.unstaged[3].status);
    try std.testing.expectEqualStrings("both.txt", changes.unstaged[3].path);
    try std.testing.expectEqual(@as(usize, 2), changes.staged.len);
    try std.testing.expectEqualStrings("A", changes.staged[0].status);
    try std.testing.expectEqualStrings("added.txt", changes.staged[0].path);
    try std.testing.expectEqualStrings("M", changes.staged[1].status);
    try std.testing.expectEqualStrings("both.txt", changes.staged[1].path);
    try std.testing.expectEqual(@as(?[]const u8, null), task.failure);
}

test "read_working_changes lists no files for a clean working tree" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = status_args,
        .expected_shown_args = status_shown_args,
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = null,
    });
    const changes = try git_status.read_working_changes(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        "repo",
    );
    try std.testing.expectEqual(@as(usize, 0), changes.unstaged.len);
    try std.testing.expectEqual(@as(usize, 0), changes.staged.len);
}

test "read_working_changes fails with GitStatusFailed when git exits with an error" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = status_args,
        .expected_shown_args = status_shown_args,
        .exit_code = 128,
        .stdout = "",
        .stderr = "fatal: not a git repository\n",
        .start_error = null,
    });
    try std.testing.expectError(error.GitStatusFailed, git_status.read_working_changes(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        "repo",
    ));
    try std.testing.expectEqualStrings(
        "Running git status failed, so the repo's changes could not be read. Check that the " ++
            "folder is a Git repo. Git's output is in Graft's log.",
        task.failure.?,
    );
}

test "read_working_changes fails when git writes output it cannot read" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = status_args,
        .expected_shown_args = status_shown_args,
        .exit_code = 0,
        .stdout = " M notes.txt",
        .stderr = "",
        .start_error = null,
    });
    try std.testing.expectError(error.UnexpectedGitStatusOutput, git_status.read_working_changes(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        "repo",
    ));
    try std.testing.expectEqualStrings(
        "Git status wrote output Graft could not read, so the repo's changes could not be " ++
            "read. Check that the git on PATH is a standard git.",
        task.failure.?,
    );
}

test "read_working_changes passes up the error when git cannot be started" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = status_args,
        .expected_shown_args = status_shown_args,
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.FileNotFound,
    });
    try std.testing.expectError(error.FileNotFound, git_status.read_working_changes(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        "repo",
    ));
    try std.testing.expectEqual(@as(?[]const u8, null), task.failure);
}

test "parse_status_output lists a file in conflict in the unstaged list alone, as U" {
    const changes = try git_status.parse_status_output(
        std.testing.allocator,
        "UU both.txt\x00AA added.txt\x00DD gone.txt\x00AU theirs.txt\x00",
    );
    defer std.testing.allocator.free(changes.unstaged);
    defer std.testing.allocator.free(changes.staged);

    try std.testing.expectEqual(@as(usize, 4), changes.unstaged.len);
    for (changes.unstaged) |file| {
        try std.testing.expectEqualStrings("U", file.status);
    }
    try std.testing.expectEqualStrings("both.txt", changes.unstaged[0].path);
    try std.testing.expectEqualStrings("theirs.txt", changes.unstaged[3].path);
    try std.testing.expectEqual(@as(usize, 0), changes.staged.len);
}

test "parse_status_output refuses an entry too short to hold a path" {
    try std.testing.expectError(
        error.UnexpectedGitStatusOutput,
        git_status.parse_status_output(std.testing.allocator, " M \x00"),
    );
}

test "parse_status_output refuses an entry with no space after its status letters" {
    try std.testing.expectError(
        error.UnexpectedGitStatusOutput,
        git_status.parse_status_output(std.testing.allocator, "MMxnotes.txt\x00"),
    );
}

test "is_unmerged finds each conflict state and no other" {
    try std.testing.expect(git_status.is_unmerged('U', 'U'));
    try std.testing.expect(git_status.is_unmerged('U', 'D'));
    try std.testing.expect(git_status.is_unmerged('D', 'U'));
    try std.testing.expect(git_status.is_unmerged('A', 'A'));
    try std.testing.expect(git_status.is_unmerged('D', 'D'));
    try std.testing.expect(!git_status.is_unmerged('M', 'M'));
    try std.testing.expect(!git_status.is_unmerged('A', 'M'));
    try std.testing.expect(!git_status.is_unmerged('?', '?'));
}

//
// Parses `mixed_output` with the allocator, for the allocation failure test, freeing both lists.
//
fn parse_mixed_output(allocator: std.mem.Allocator) !void {
    const changes = try git_status.parse_status_output(allocator, mixed_output);
    allocator.free(changes.unstaged);
    allocator.free(changes.staged);
}

test "parse_status_output frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, parse_mixed_output, .{});
}
