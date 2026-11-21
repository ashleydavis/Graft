//
// Tests the `diff-tree` wrapper with the mock of the Git interface function in place of `git`: the
// arguments it starts git with for a commit's changed files and their line counts and for one
// file's diff, how it parses git's list of changed files and their line counts and every way the
// request or git's output can be refused.
//

const std = @import("std");
const git_diff_tree = @import("../lib/git-diff-tree.zig");
const git_mock = @import("git-mock.zig");

const io = std.testing.io;

//
// The hash of the commit the tests read.
//
const commit_hash = "1111111111111111111111111111111111111111";

//
// The arguments `read_changed_files` starts git with for the status of each file the commit in the
// repo at "repo" changed.
//
const changed_files_args: []const []const u8 = &.{
    "-C",
    "repo",
    "diff-tree",
    "-r",
    "-z",
    "--root",
    "--no-commit-id",
    "--name-status",
    commit_hash,
};

//
// The arguments the help panel is given to show for the same command.
//
const changed_files_shown_args: []const []const u8 = &.{
    "diff-tree",
    "-r",
    "--root",
    "--no-commit-id",
    "--name-status",
    commit_hash,
};

//
// The arguments `read_changed_files` starts git with for the line counts of each file the commit
// in the repo at "repo" changed.
//
const numstat_args: []const []const u8 = &.{
    "-C",
    "repo",
    "diff-tree",
    "-r",
    "-z",
    "--root",
    "--no-commit-id",
    "--numstat",
    commit_hash,
};

//
// The arguments the help panel is given to show for the same command.
//
const numstat_shown_args: []const []const u8 = &.{
    "diff-tree",
    "-r",
    "--root",
    "--no-commit-id",
    "--numstat",
    commit_hash,
};

//
// The arguments `read_file_diff` starts git with for notes.txt in the commit in the repo at "repo".
//
const file_diff_args: []const []const u8 = &.{
    "-C",
    "repo",
    "diff-tree",
    "-r",
    "-p",
    "--root",
    "--no-commit-id",
    commit_hash,
    "--",
    "notes.txt",
};

//
// The arguments the help panel is given to show for the same command.
//
const file_diff_shown_args: []const []const u8 = &.{
    "diff-tree",
    "-r",
    "-p",
    "--root",
    "--no-commit-id",
    commit_hash,
    "--",
    "notes.txt",
};

//
// The request for the changed files of the commit in the repo at "repo".
//
const changed_files_request: git_diff_tree.ChangedFilesRequest = .{
    .repo_path = "repo",
    .hash = commit_hash,
};

//
// The request for the diff of notes.txt in the commit in the repo at "repo".
//
const file_diff_request: git_diff_tree.FileDiffRequest = .{
    .repo_path = "repo",
    .hash = commit_hash,
    .path = "notes.txt",
};

//
// What `git diff-tree -z --name-status` writes for a commit that changed three files.
//
const three_files_output = "M\x00notes.txt\x00A\x00docs/new file.md\x00D\x00old.txt\x00";

//
// What `git diff-tree -z --numstat` writes for the same three files, the last of them binary.
//
const three_files_numstat = "1\t1\tnotes.txt\x00" ++
    "12\t0\tdocs/new file.md\x00" ++
    "-\t-\told.txt\x00";

//
// The git calls `read_changed_files` makes for the three files, with the output git writes for
// them.
//
const three_files_calls: []const git_mock.MockGitOptions = &.{
    .{
        .expected_args = changed_files_args,
        .expected_shown_args = changed_files_shown_args,
        .exit_code = 0,
        .stdout = three_files_output,
        .stderr = "",
        .start_error = null,
    },
    .{
        .expected_args = numstat_args,
        .expected_shown_args = numstat_shown_args,
        .exit_code = 0,
        .stdout = three_files_numstat,
        .stderr = "",
        .start_error = null,
    },
};

//
// What `git diff-tree -p` writes for notes.txt changed from one line to another.
//
const notes_diff = "diff --git a/notes.txt b/notes.txt\n" ++
    "index ad96917..f76ea96 100644\n" ++
    "--- a/notes.txt\n" ++
    "+++ b/notes.txt\n" ++
    "@@ -1 +1 @@\n" ++
    "-The first note.\n" ++
    "+The second note.\n";

//
// A mock that is never expected to be called: it fails the test's call if the code starts git.
//
const mock_never_called = git_mock.mock_git(.{
    .expected_args = &.{},
    .expected_shown_args = &.{},
    .exit_code = 0,
    .stdout = "",
    .stderr = "",
    .start_error = error.GitStartedWhenItShouldNotBe,
});

test "read_changed_files lists each file the commit changed with its status and line counts" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git_calls(three_files_calls);
    const files = try git_diff_tree.read_changed_files(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        changed_files_request,
    );
    try std.testing.expectEqual(@as(usize, 3), files.len);
    try std.testing.expectEqualStrings("M", files[0].status);
    try std.testing.expectEqualStrings("notes.txt", files[0].path);
    try std.testing.expectEqual(@as(u32, 1), files[0].linesAdded);
    try std.testing.expectEqual(@as(u32, 1), files[0].linesDeleted);
    try std.testing.expect(!files[0].isBinary);
    try std.testing.expectEqualStrings("A", files[1].status);
    try std.testing.expectEqualStrings("docs/new file.md", files[1].path);
    try std.testing.expectEqual(@as(u32, 12), files[1].linesAdded);
    try std.testing.expectEqual(@as(u32, 0), files[1].linesDeleted);
    try std.testing.expect(!files[1].isBinary);
    try std.testing.expectEqualStrings("D", files[2].status);
    try std.testing.expectEqualStrings("old.txt", files[2].path);
    try std.testing.expectEqual(@as(u32, 0), files[2].linesAdded);
    try std.testing.expectEqual(@as(u32, 0), files[2].linesDeleted);
    try std.testing.expect(files[2].isBinary);
}

test "read_changed_files lists no files when git lists none, as for a merge commit" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git_calls(&.{
        .{
            .expected_args = changed_files_args,
            .expected_shown_args = changed_files_shown_args,
            .exit_code = 0,
            .stdout = "",
            .stderr = "",
            .start_error = null,
        },
        .{
            .expected_args = numstat_args,
            .expected_shown_args = numstat_shown_args,
            .exit_code = 0,
            .stdout = "",
            .stderr = "",
            .start_error = null,
        },
    });
    const files = try git_diff_tree.read_changed_files(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        changed_files_request,
    );
    try std.testing.expectEqual(@as(usize, 0), files.len);
}

test "read_changed_files refuses a hash that git could read as an option without starting git" {
    var task = git_mock.mock_task();
    try std.testing.expectError(error.InvalidCommitHash, git_diff_tree.read_changed_files(
        io,
        git_mock.mock_services(&task),
        std.testing.allocator,
        mock_never_called,
        .{
            .repo_path = "repo",
            .hash = "--all",
        },
    ));
    try std.testing.expectEqualStrings(
        "A commit was asked for by a hash that is not hexadecimal. Give the hash of a commit.",
        task.failure.?,
    );
}

test "read_changed_files fails with GitDiffTreeFailed when git exits with an error" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = changed_files_args,
        .expected_shown_args = changed_files_shown_args,
        .exit_code = 128,
        .stdout = "",
        .stderr = "fatal: bad object\n",
        .start_error = null,
    });
    try std.testing.expectError(error.GitDiffTreeFailed, git_diff_tree.read_changed_files(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        changed_files_request,
    ));
    try std.testing.expectEqualStrings(
        "Running git diff-tree failed, so the commit's changes could not be read. Check that " ++
            "the repo has the commit. What git said is in Graft's log.",
        task.failure.?,
    );
}

test "read_changed_files fails with GitDiffTreeFailed when git exits with an error counting lines" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git_calls(&.{
        three_files_calls[0],
        .{
            .expected_args = numstat_args,
            .expected_shown_args = numstat_shown_args,
            .exit_code = 128,
            .stdout = "",
            .stderr = "fatal: bad object\n",
            .start_error = null,
        },
    });
    try std.testing.expectError(error.GitDiffTreeFailed, git_diff_tree.read_changed_files(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        changed_files_request,
    ));
    try std.testing.expectEqualStrings(
        "Running git diff-tree failed, so the commit's changes could not be read. Check that " ++
            "the repo has the commit. What git said is in Graft's log.",
        task.failure.?,
    );
}

test "read_changed_files refuses a changed file git listed with no path" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = changed_files_args,
        .expected_shown_args = changed_files_shown_args,
        .exit_code = 0,
        .stdout = "M\x00",
        .stderr = "",
        .start_error = null,
    });
    try std.testing.expectError(error.UnexpectedGitDiffTreeOutput, git_diff_tree.read_changed_files(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        changed_files_request,
    ));
    try std.testing.expectEqualStrings(
        "Git diff-tree wrote output Graft could not read, so the commit's changed files could " ++
            "not be read. Check that the git on PATH is a standard git.",
        task.failure.?,
    );
}

test "read_changed_files refuses line counts that are not for the files git listed" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git_calls(&.{
        three_files_calls[0],
        .{
            .expected_args = numstat_args,
            .expected_shown_args = numstat_shown_args,
            .exit_code = 0,
            .stdout = "1\t1\tnotes.txt\x00",
            .stderr = "",
            .start_error = null,
        },
    });
    try std.testing.expectError(error.UnexpectedGitDiffTreeOutput, git_diff_tree.read_changed_files(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        changed_files_request,
    ));
    try std.testing.expectEqualStrings(
        "Git diff-tree wrote output Graft could not read, so the commit's changed files could " ++
            "not be read. Check that the git on PATH is a standard git.",
        task.failure.?,
    );
}

test "read_changed_files passes up the error when git cannot be started" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = changed_files_args,
        .expected_shown_args = changed_files_shown_args,
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.FileNotFound,
    });
    try std.testing.expectError(error.FileNotFound, git_diff_tree.read_changed_files(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        changed_files_request,
    ));
    try std.testing.expectEqual(@as(?[]const u8, null), task.failure);
}

//
// Reads the changed files of `three_files_output` with the allocator, for the allocation failure
// test. They are allocated in an arena over the allocator, as a task's are.
//
fn read_three_files(allocator: std.mem.Allocator) !void {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git_calls(three_files_calls);
    _ = try git_diff_tree.read_changed_files(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        changed_files_request,
    );
}

test "read_changed_files frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, read_three_files, .{});
}

test "parse_name_status_output refuses a status with no path" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_name_status_output(arena.allocator(), "M\x00notes.txt\x00A\x00"),
    );
}

test "parse_name_status_output refuses output that does not end with a NUL" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_name_status_output(arena.allocator(), "M\x00notes.txt\x00extra"),
    );
}

test "parse_name_status_output refuses a status that is not one letter, such as a rename's" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_name_status_output(arena.allocator(), "R100\x00old.txt\x00"),
    );
}

test "parse_name_status_output refuses an empty path" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_name_status_output(arena.allocator(), "M\x00\x00"),
    );
}

//
// Parses what `git diff-tree -z --name-status` wrote for notes.txt and docs/a.md, for the tests
// of `parse_numstat_output`. The files are allocated in the arena.
//
fn two_changed_files(arena: std.mem.Allocator) ![]git_diff_tree.ChangedFile {
    return git_diff_tree.parse_name_status_output(arena, "M\x00notes.txt\x00A\x00docs/a.md\x00");
}

test "parse_numstat_output refuses counts for fewer files than were listed" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const files = try two_changed_files(arena.allocator());
    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_numstat_output(files, "1\t1\tnotes.txt\x00"),
    );
}

test "parse_numstat_output refuses output that does not end with a NUL" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const files = try two_changed_files(arena.allocator());
    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_numstat_output(files, "1\t1\tnotes.txt\x002\t0\tdocs/a.md\x00extra"),
    );
}

test "parse_numstat_output refuses counts for files in another order" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const files = try two_changed_files(arena.allocator());
    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_numstat_output(files, "2\t0\tdocs/a.md\x001\t1\tnotes.txt\x00"),
    );
}

test "parse_numstat_output refuses an entry with only one count" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const files = try two_changed_files(arena.allocator());
    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_numstat_output(files, "1\x002\t0\tdocs/a.md\x00"),
    );
}

test "parse_numstat_output refuses a count that is not a number" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const files = try two_changed_files(arena.allocator());
    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_numstat_output(files, "x\t1\tnotes.txt\x002\t0\tdocs/a.md\x00"),
    );
}

test "parse_numstat_output refuses a deleted count that is not a number" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const files = try two_changed_files(arena.allocator());
    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_numstat_output(files, "1\tx\tnotes.txt\x002\t0\tdocs/a.md\x00"),
    );
}

test "parse_numstat_output refuses a binary file's counts when only one of them is binary" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const files = try two_changed_files(arena.allocator());
    try std.testing.expectError(
        error.UnexpectedGitDiffTreeOutput,
        git_diff_tree.parse_numstat_output(files, "-\t1\tnotes.txt\x002\t0\tdocs/a.md\x00"),
    );
}

test "parse_numstat_output keeps a path that holds a tab whole" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const files = try git_diff_tree.parse_name_status_output(
        arena.allocator(),
        "M\x00a\tb.txt\x00",
    );
    try git_diff_tree.parse_numstat_output(files, "3\t4\ta\tb.txt\x00");
    try std.testing.expectEqual(@as(u32, 3), files[0].linesAdded);
    try std.testing.expectEqual(@as(u32, 4), files[0].linesDeleted);
}

test "read_file_diff reads the diff of the one file in the commit" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = file_diff_args,
        .expected_shown_args = file_diff_shown_args,
        .exit_code = 0,
        .stdout = notes_diff,
        .stderr = "",
        .start_error = null,
    });
    const diff = try git_diff_tree.read_file_diff(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        file_diff_request,
    );
    try std.testing.expectEqualStrings(notes_diff, diff);
}

test "read_file_diff refuses a hash that git could read as an option without starting git" {
    var task = git_mock.mock_task();
    try std.testing.expectError(error.InvalidCommitHash, git_diff_tree.read_file_diff(
        io,
        git_mock.mock_services(&task),
        std.testing.allocator,
        mock_never_called,
        .{
            .repo_path = "repo",
            .hash = "-p",
            .path = "notes.txt",
        },
    ));
    try std.testing.expectEqualStrings(
        "A commit was asked for by a hash that is not hexadecimal. Give the hash of a commit.",
        task.failure.?,
    );
}

test "read_file_diff refuses an empty path without starting git" {
    var task = git_mock.mock_task();
    try std.testing.expectError(error.InvalidFilePath, git_diff_tree.read_file_diff(
        io,
        git_mock.mock_services(&task),
        std.testing.allocator,
        mock_never_called,
        .{
            .repo_path = "repo",
            .hash = commit_hash,
            .path = "",
        },
    ));
    try std.testing.expectEqualStrings(
        "A file's diff was asked for with an empty path. Give the path of a file the commit " ++
            "changed.",
        task.failure.?,
    );
}

test "read_file_diff fails with GitDiffTreeFailed when git exits with an error" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = file_diff_args,
        .expected_shown_args = file_diff_shown_args,
        .exit_code = 128,
        .stdout = "",
        .stderr = "fatal: bad object\n",
        .start_error = null,
    });
    try std.testing.expectError(error.GitDiffTreeFailed, git_diff_tree.read_file_diff(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        file_diff_request,
    ));
    try std.testing.expectEqualStrings(
        "Running git diff-tree failed, so the commit's changes could not be read. Check that " ++
            "the repo has the commit. What git said is in Graft's log.",
        task.failure.?,
    );
}

//
// Reads the diff of notes.txt with the allocator, for the allocation failure test. The diff is
// allocated in an arena over the allocator, as a task's is.
//
fn read_notes_diff(allocator: std.mem.Allocator) !void {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = file_diff_args,
        .expected_shown_args = file_diff_shown_args,
        .exit_code = 0,
        .stdout = notes_diff,
        .stderr = "",
        .start_error = null,
    });
    _ = try git_diff_tree.read_file_diff(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        mock,
        file_diff_request,
    );
}

test "read_file_diff frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, read_notes_diff, .{});
}
