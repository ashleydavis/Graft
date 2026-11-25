//
// Tests the `branch` wrapper with the mock of the Git interface function in place of `git`: the
// arguments it starts git with, how it reads git's list of branches and the checked-out one, and
// every way git's output or git itself can fail.
//

const std = @import("std");
const git_branch = @import("../lib/git-branch.zig");
const git_interface = @import("../lib/git-interface.zig");
const git_mock = @import("git-mock.zig");

const io = std.testing.io;

//
// The arguments `read_branches` starts git with for the repo at "repo".
//
const branch_args: []const []const u8 = &.{
    "-C",
    "repo",
    "for-each-ref",
    "--sort=refname",
    "--format=%(HEAD) %(refname)",
    "refs/heads/",
};

//
// The arguments the help panel is given to show for the same command, which are the arguments git
// runs with, because none of them is there only for the parser.
//
const branch_shown_args: []const []const u8 = &.{
    "for-each-ref",
    "--sort=refname",
    "--format=%(HEAD) %(refname)",
    "refs/heads/",
};

//
// What `git for-each-ref` writes for a repo with main checked out and a branch with a slash in its
// name.
//
const two_branches_output = "  refs/heads/feature/x\n* refs/heads/main\n";

//
// Makes a mock of the branch call that returns the output and the exit code.
//
fn branch_mock(comptime output: []const u8, comptime exit_code: ?u8) git_interface.RunGit {
    return git_mock.mock_git(.{
        .expected_args = branch_args,
        .expected_shown_args = branch_shown_args,
        .exit_code = exit_code,
        .stdout = output,
        .stderr = "",
        .start_error = null,
    });
}

test "read_branches lists each local branch by name and marks the checked-out one" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const branches = try git_branch.read_branches(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        branch_mock(two_branches_output, 0),
        "repo",
    );
    try std.testing.expectEqual(@as(usize, 2), branches.branches.len);
    try std.testing.expectEqualStrings("feature/x", branches.branches[0].name);
    try std.testing.expect(!branches.branches[0].isCheckedOut);
    try std.testing.expectEqualStrings("main", branches.branches[1].name);
    try std.testing.expect(branches.branches[1].isCheckedOut);
}

test "read_branches lists no branches when git lists none, as in a repo with no commits" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const branches = try git_branch.read_branches(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        branch_mock("", 0),
        "repo",
    );
    try std.testing.expectEqual(@as(usize, 0), branches.branches.len);
    try std.testing.expect(task.failure == null);
}

test "read_branches refuses an empty repo path without starting git" {
    var task = git_mock.mock_task();
    const mock = comptime git_mock.mock_git(.{
        .expected_args = &.{},
        .expected_shown_args = &.{},
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.GitStartedWhenItShouldNotBe,
    });
    try std.testing.expectError(error.InvalidRepoPath, git_branch.read_branches(
        io,
        git_mock.mock_services(&task),
        std.testing.allocator,
        mock,
        "",
    ));
    try std.testing.expect(task.failure != null);
}

test "read_branches fails with GitBranchFailed and a description when git exits with an error" {
    var task = git_mock.mock_task();
    try std.testing.expectError(error.GitBranchFailed, git_branch.read_branches(
        io,
        git_mock.mock_services(&task),
        std.testing.allocator,
        branch_mock("", 128),
        "repo",
    ));
    try std.testing.expect(std.mem.indexOf(
        u8,
        task.failure.?,
        "Running git for-each-ref failed",
    ) != null);
}

test "read_branches fails with GitBranchFailed when git ends without exiting" {
    var task = git_mock.mock_task();
    try std.testing.expectError(error.GitBranchFailed, git_branch.read_branches(
        io,
        git_mock.mock_services(&task),
        std.testing.allocator,
        branch_mock("", null),
        "repo",
    ));
}

test "read_branches refuses output it cannot read and describes the error" {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    try std.testing.expectError(error.UnexpectedGitBranchOutput, git_branch.read_branches(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        branch_mock("* refs/heads/main", 0),
        "repo",
    ));
    try std.testing.expect(std.mem.indexOf(
        u8,
        task.failure.?,
        "Git for-each-ref wrote output Graft could not read",
    ) != null);
}

test "read_branches passes up the error when git cannot be started" {
    var task = git_mock.mock_task();
    const mock = comptime git_mock.mock_git(.{
        .expected_args = branch_args,
        .expected_shown_args = branch_shown_args,
        .exit_code = 0,
        .stdout = "",
        .stderr = "",
        .start_error = error.FileNotFound,
    });
    try std.testing.expectError(error.FileNotFound, git_branch.read_branches(
        io,
        git_mock.mock_services(&task),
        std.testing.allocator,
        mock,
        "repo",
    ));
}

//
// Reads `two_branches_output` with the allocator, for the allocation failure test. The branches
// are allocated in an arena over the allocator, as a task's are.
//
fn read_two_branches(allocator: std.mem.Allocator) !void {
    var task = git_mock.mock_task();
    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();

    _ = try git_branch.read_branches(
        io,
        git_mock.mock_services(&task),
        arena.allocator(),
        branch_mock(two_branches_output, 0),
        "repo",
    );
}

test "read_branches frees everything when an allocation fails" {
    try std.testing.checkAllAllocationFailures(std.testing.allocator, read_two_branches, .{});
}

test "parse_branch_output frees the list when a later line cannot be read" {
    try std.testing.expectError(
        error.UnexpectedGitBranchOutput,
        git_branch.parse_branch_output(std.testing.allocator, "* refs/heads/main\nbad line\n"),
    );
}

test "parse_branch_output refuses output that does not end with a newline" {
    try std.testing.expectError(
        error.UnexpectedGitBranchOutput,
        git_branch.parse_branch_output(std.testing.allocator, "* refs/heads/main"),
    );
}

test "parse_branch_line reads the checked-out mark and the name after refs/heads/" {
    const checked_out = try git_branch.parse_branch_line("* refs/heads/main");
    try std.testing.expectEqualStrings("main", checked_out.name);
    try std.testing.expect(checked_out.isCheckedOut);

    const other = try git_branch.parse_branch_line("  refs/heads/feature/x");
    try std.testing.expectEqualStrings("feature/x", other.name);
    try std.testing.expect(!other.isCheckedOut);
}

test "parse_branch_line refuses a line too short to hold a branch's name" {
    try std.testing.expectError(
        error.UnexpectedGitBranchOutput,
        git_branch.parse_branch_line("* refs/heads/"),
    );
    try std.testing.expectError(error.UnexpectedGitBranchOutput, git_branch.parse_branch_line(""));
}

test "parse_branch_line refuses a line with no space after the mark" {
    try std.testing.expectError(
        error.UnexpectedGitBranchOutput,
        git_branch.parse_branch_line("*-refs/heads/main"),
    );
}

test "parse_branch_line refuses a ref outside refs/heads/" {
    try std.testing.expectError(
        error.UnexpectedGitBranchOutput,
        git_branch.parse_branch_line("* refs/tags/v1.0.0"),
    );
}

test "parse_branch_line refuses a mark that is neither * nor a space" {
    try std.testing.expectError(
        error.UnexpectedGitBranchOutput,
        git_branch.parse_branch_line("+ refs/heads/main"),
    );
}

test "is_listed_branch finds only a name among the branches" {
    const branches: git_branch.Branches = .{
        .branches = &.{
            .{
                .name = "feature/x",
                .isCheckedOut = false,
            },
            .{
                .name = "main",
                .isCheckedOut = true,
            },
        },
    };
    try std.testing.expect(git_branch.is_listed_branch(branches, "feature/x"));
    try std.testing.expect(git_branch.is_listed_branch(branches, "main"));
    try std.testing.expect(!git_branch.is_listed_branch(branches, "feature"));
    try std.testing.expect(!git_branch.is_listed_branch(branches, "--all"));
    try std.testing.expect(!git_branch.is_listed_branch(branches, ""));
}
