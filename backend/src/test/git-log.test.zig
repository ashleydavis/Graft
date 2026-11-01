//
// Tests the `log` wrapper with the mock of the Git interface function in place of `git`: the
// arguments it starts git with for the first page, for a later page and for one commit, how it
// parses git's output into commits, and every way the request or git's output can be refused.
//

const std = @import("std");
const ziggy = @import("ziggy");
const git_interface = @import("../lib/git-interface.zig");
const git_log = @import("../lib/git-log.zig");
const git_mock = @import("git-mock.zig");

const io = std.testing.io;
const ConsoleLog = ziggy.task_queue.utils.log.ConsoleLog;

//
// The format argument the wrapper must pass, spelled out here so a change to it fails the tests.
//
const format_arg = "--format=%H%x1f%P%x1f%D%x1f%an%x1f%ae%x1f%aI%x1f%cn%x1f%ce%x1f%cI%x1f%s%x1f%b";

//
// The hashes of the two commits in `two_commits_output`.
//
const second_hash = "1111111111111111111111111111111111111111";
const first_hash = "2222222222222222222222222222222222222222";

//
// What `git log -z` writes for a repo of two commits: the second, a merge-free commit with refs
// and a description of two lines, then the first, the root commit with no refs and no
// description.
//
const two_commits_output = second_hash ++ "\x1f" ++ first_hash ++ "\x1f" ++
    "HEAD -> main, tag: v1\x1f" ++
    "Ada Author\x1fada@example.com\x1f2026-01-02T03:04:05+10:00\x1f" ++
    "Cy Committer\x1fcy@example.com\x1f2026-01-02T03:04:06+10:00\x1f" ++
    "The second commit\x1fThe first line.\nThe second line.\n\x00" ++
    first_hash ++ "\x1f\x1f\x1f" ++
    "Ada Author\x1fada@example.com\x1f2026-01-01T00:00:00+00:00\x1f" ++
    "Ada Author\x1fada@example.com\x1f2026-01-01T00:00:00+00:00\x1f" ++
    "The first commit\x1f\x00";

//
// The arguments for the first page of the repo at "repo", 50 commits long.
//
const first_page_args: []const []const u8 = &.{
    "-C",
    "repo",
    "log",
    "-z",
    "--max-count=50",
    format_arg,
};

//
// A mock that answers the first page's arguments as git does when it succeeds with the output.
//
fn mock_first_page(comptime output: []const u8) git_interface.RunGit {
    return git_mock.mock_git(.{
        .expected_args = first_page_args,
        .exit_code = 0,
        .stdout = output,
        .stderr = "",
        .start_error = null,
    });
}

//
// The request for the first page of the repo at "repo", 50 commits long.
//
const first_page_request: git_log.LogPageRequest = .{
    .repo_path = "repo",
    .page_size = 50,
    .after_hash = null,
};

test "read_log_page reads the first page from HEAD and parses every field of each commit" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const page = try git_log.read_log_page(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock_first_page(two_commits_output),
        first_page_request,
    );
    try std.testing.expectEqual(@as(usize, 2), page.commits.len);

    const second = page.commits[0];
    try std.testing.expectEqualStrings(second_hash, second.hash);
    try std.testing.expectEqual(@as(usize, 1), second.parentHashes.len);
    try std.testing.expectEqualStrings(first_hash, second.parentHashes[0]);
    try std.testing.expectEqual(@as(usize, 2), second.refs.len);
    try std.testing.expectEqualStrings("HEAD -> main", second.refs[0]);
    try std.testing.expectEqualStrings("tag: v1", second.refs[1]);
    try std.testing.expectEqualStrings("Ada Author", second.authorName);
    try std.testing.expectEqualStrings("ada@example.com", second.authorEmail);
    try std.testing.expectEqualStrings("2026-01-02T03:04:05+10:00", second.authorDate);
    try std.testing.expectEqualStrings("Cy Committer", second.committerName);
    try std.testing.expectEqualStrings("cy@example.com", second.committerEmail);
    try std.testing.expectEqualStrings("2026-01-02T03:04:06+10:00", second.committerDate);
    try std.testing.expectEqualStrings("The second commit", second.title);
    try std.testing.expectEqualStrings("The first line.\nThe second line.", second.description);

    const first = page.commits[1];
    try std.testing.expectEqualStrings(first_hash, first.hash);
    try std.testing.expectEqual(@as(usize, 0), first.parentHashes.len);
    try std.testing.expectEqual(@as(usize, 0), first.refs.len);
    try std.testing.expectEqualStrings("The first commit", first.title);
    try std.testing.expectEqualStrings("", first.description);
}

test "read_log_page starts a later page from the previous page's last commit and skips it" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{
            "-C",
            "repo",
            "log",
            "-z",
            "--max-count=1",
            format_arg,
            "--skip=1",
            second_hash,
        },
        .exit_code = 0,
        .stdout = first_hash ++ "\x1f\x1f\x1f" ++
            "A\x1fa@example.com\x1fd\x1fA\x1fa@example.com\x1fd\x1f" ++
            "The first commit\x1f\x00",
        .stderr = "",
        .start_error = null,
    });
    const page = try git_log.read_log_page(io, ConsoleLog.init(), arena.allocator(), mock, .{
        .repo_path = "repo",
        .page_size = 1,
        .after_hash = second_hash,
    });
    try std.testing.expectEqual(@as(usize, 1), page.commits.len);
    try std.testing.expectEqualStrings(first_hash, page.commits[0].hash);
}

test "read_log_page reads an empty page when git lists no commits" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const page = try git_log.read_log_page(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock_first_page(""),
        first_page_request,
    );
    try std.testing.expectEqual(@as(usize, 0), page.commits.len);
}

test "read_log_page refuses a page size of 0 without starting git" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{},
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.GitStartedWhenItShouldNotBe,
    });
    try std.testing.expectError(error.InvalidPageSize, git_log.read_log_page(
        io,
        ConsoleLog.init(),
        std.testing.allocator,
        mock,
        .{
            .repo_path = "repo",
            .page_size = 0,
            .after_hash = null,
        },
    ));
}

test "read_log_page refuses an after hash that git could read as an option" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{},
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.GitStartedWhenItShouldNotBe,
    });
    try std.testing.expectError(error.InvalidCommitHash, git_log.read_log_page(
        io,
        ConsoleLog.init(),
        std.testing.allocator,
        mock,
        .{
            .repo_path = "repo",
            .page_size = 10,
            .after_hash = "--all",
        },
    ));
}

test "read_log_page fails with GitLogFailed when git exits with an error" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = first_page_args,
        .exit_code = 128,
        .stdout = "",
        .stderr = "fatal: your current branch 'main' does not have any commits yet\n",
        .start_error = null,
    });
    try std.testing.expectError(error.GitLogFailed, git_log.read_log_page(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        first_page_request,
    ));
}

test "read_log_page fails with GitLogFailed when git ends without exiting" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = first_page_args,
        .exit_code = null,
        .stdout = "",
        .stderr = "",
        .start_error = null,
    });
    try std.testing.expectError(error.GitLogFailed, git_log.read_log_page(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        first_page_request,
    ));
}

test "read_log_page passes up the error when git cannot be started" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = first_page_args,
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.FileNotFound,
    });
    try std.testing.expectError(error.FileNotFound, git_log.read_log_page(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        first_page_request,
    ));
}

//
// Reads the first page of `two_commits_output` with the allocator, for the allocation failure
// test. The page is allocated in an arena over the allocator, as a task's is.
//
fn read_two_commits(allocator: std.mem.Allocator) !void {
    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();

    _ = try git_log.read_log_page(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock_first_page(two_commits_output),
        first_page_request,
    );
}

test "read_log_page frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, read_two_commits, .{});
}

test "parse_log_output refuses more commits than the page holds" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedGitLogOutput,
        git_log.parse_log_output(arena.allocator(), two_commits_output, 1),
    );
}

test "parse_log_output refuses output that does not end with a commit's NUL" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedGitLogOutput,
        git_log.parse_log_output(arena.allocator(), two_commits_output ++ "extra", 10),
    );
}

test "parse_commit refuses a record with too few fields" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedGitLogOutput,
        git_log.parse_commit(arena.allocator(), first_hash ++ "\x1f\x1f"),
    );
}

test "parse_commit refuses a record with every field but the description" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedGitLogOutput,
        git_log.parse_commit(
            arena.allocator(),
            first_hash ++ "\x1f\x1f\x1fA\x1fa\x1fd\x1fC\x1fc\x1fd\x1ftitle",
        ),
    );
}

test "parse_commit refuses a record whose hash is not a hash" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(
        error.UnexpectedGitLogOutput,
        git_log.parse_commit(
            arena.allocator(),
            "not a hash\x1f\x1f\x1fA\x1fa\x1fd\x1fC\x1fc\x1fd\x1ftitle\x1f",
        ),
    );
}

test "parse_commit keeps a description that holds the field separator" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const commit = try git_log.parse_commit(
        arena.allocator(),
        first_hash ++ "\x1f\x1f\x1fA\x1fa\x1fd\x1fC\x1fc\x1fd\x1ftitle\x1fone\x1ftwo\n",
    );
    try std.testing.expectEqualStrings("one\x1ftwo", commit.description);
}

test "split_list splits a list git writes on one line, and an empty line is an empty list" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const empty = try git_log.split_list(arena.allocator(), .{
        .text = "",
        .separator = " ",
    });
    try std.testing.expectEqual(@as(usize, 0), empty.len);

    const one = try git_log.split_list(arena.allocator(), .{
        .text = "abc",
        .separator = " ",
    });
    try std.testing.expectEqual(@as(usize, 1), one.len);
    try std.testing.expectEqualStrings("abc", one[0]);

    const three = try git_log.split_list(arena.allocator(), .{
        .text = "HEAD -> main, origin/main, tag: v1",
        .separator = ", ",
    });
    try std.testing.expectEqual(@as(usize, 3), three.len);
    try std.testing.expectEqualStrings("HEAD -> main", three[0]);
    try std.testing.expectEqualStrings("origin/main", three[1]);
    try std.testing.expectEqualStrings("tag: v1", three[2]);
}

test "is_commit_hash accepts hexadecimal digits only" {
    try std.testing.expect(git_log.is_commit_hash(first_hash));
    try std.testing.expect(git_log.is_commit_hash("abcDEF09"));
    try std.testing.expect(!git_log.is_commit_hash(""));
    try std.testing.expect(!git_log.is_commit_hash("--all"));
    try std.testing.expect(!git_log.is_commit_hash("abc g"));
}

//
// The arguments `read_commit` starts git with for the second commit of the repo at "repo".
//
const commit_args: []const []const u8 = &.{
    "-C",
    "repo",
    "log",
    "-z",
    "--max-count=1",
    format_arg,
    second_hash,
};

//
// The request for the second commit of the repo at "repo".
//
const commit_request: git_log.CommitRequest = .{
    .repo_path = "repo",
    .hash = second_hash,
};

//
// What `git log -z --max-count=1` writes for the second commit of `two_commits_output`.
//
const second_commit_output = second_hash ++ "\x1f" ++ first_hash ++ "\x1f" ++
    "HEAD -> main, tag: v1\x1f" ++
    "Ada Author\x1fada@example.com\x1f2026-01-02T03:04:05+10:00\x1f" ++
    "Cy Committer\x1fcy@example.com\x1f2026-01-02T03:04:06+10:00\x1f" ++
    "The second commit\x1fThe first line.\nThe second line.\n\x00";

test "read_commit reads the one commit the hash names and parses its fields" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = commit_args,
        .exit_code = 0,
        .stdout = second_commit_output,
        .stderr = "",
        .start_error = null,
    });
    const commit = try git_log.read_commit(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        commit_request,
    );
    try std.testing.expectEqualStrings(second_hash, commit.hash);
    try std.testing.expectEqual(@as(usize, 1), commit.parentHashes.len);
    try std.testing.expectEqualStrings(first_hash, commit.parentHashes[0]);
    try std.testing.expectEqualStrings("Cy Committer", commit.committerName);
    try std.testing.expectEqualStrings("The second commit", commit.title);
    try std.testing.expectEqualStrings("The first line.\nThe second line.", commit.description);
}

test "read_commit refuses a hash that git could read as an option without starting git" {
    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{},
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.GitStartedWhenItShouldNotBe,
    });
    try std.testing.expectError(error.InvalidCommitHash, git_log.read_commit(
        io,
        ConsoleLog.init(),
        std.testing.allocator,
        mock,
        .{
            .repo_path = "repo",
            .hash = "--all",
        },
    ));
}

test "read_commit fails with CommitReadFailed when git exits with an error" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = commit_args,
        .exit_code = 128,
        .stdout = "",
        .stderr = "fatal: bad object\n",
        .start_error = null,
    });
    try std.testing.expectError(error.CommitReadFailed, git_log.read_commit(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        commit_request,
    ));
}

test "read_commit refuses output that holds no commit" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = commit_args,
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = null,
    });
    try std.testing.expectError(error.UnexpectedGitLogOutput, git_log.read_commit(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        commit_request,
    ));
}

test "read_commit refuses output that holds more than one commit" {
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = commit_args,
        .exit_code = 0,
        .stdout = two_commits_output,
        .stderr = "",
        .start_error = null,
    });
    try std.testing.expectError(error.UnexpectedGitLogOutput, git_log.read_commit(
        io,
        ConsoleLog.init(),
        arena.allocator(),
        mock,
        commit_request,
    ));
}

//
// Reads the second commit with the allocator, for the allocation failure test. The commit is
// allocated in an arena over the allocator, as a task's is.
//
fn read_second_commit(allocator: std.mem.Allocator) !void {
    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();

    const mock = comptime git_mock.mock_git(.{
        .expected_args = commit_args,
        .exit_code = 0,
        .stdout = second_commit_output,
        .stderr = "",
        .start_error = null,
    });
    _ = try git_log.read_commit(io, ConsoleLog.init(), arena.allocator(), mock, commit_request);
}

test "read_commit frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, read_second_commit, .{});
}
