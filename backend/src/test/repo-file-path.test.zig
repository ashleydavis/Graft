//
// Tests the check of the file paths the changes pane's tasks are sent: paths inside the repo pass
// and empty, absolute and parent directory paths are refused, with each separator.
//

const std = @import("std");
const repo_file_path = @import("../lib/repo-file-path.zig");

test "is_repo_file_path accepts a path inside the repo" {
    try std.testing.expect(repo_file_path.is_repo_file_path("notes.txt"));
    try std.testing.expect(repo_file_path.is_repo_file_path("docs/new.txt"));
    try std.testing.expect(repo_file_path.is_repo_file_path("-starts-with-a-dash"));
    try std.testing.expect(repo_file_path.is_repo_file_path("a..b/..c/d.."));
    try std.testing.expect(repo_file_path.is_repo_file_path("."));
}

test "is_repo_file_path refuses an empty path" {
    try std.testing.expect(!repo_file_path.is_repo_file_path(""));
}

test "is_repo_file_path refuses an absolute path" {
    try std.testing.expect(!repo_file_path.is_repo_file_path("/etc/passwd"));
    try std.testing.expect(!repo_file_path.is_repo_file_path("\\Windows\\win.ini"));
    try std.testing.expect(!repo_file_path.is_repo_file_path("C:\\Windows\\win.ini"));
    try std.testing.expect(!repo_file_path.is_repo_file_path("C:"));
}

test "is_repo_file_path refuses a path with a parent directory part" {
    try std.testing.expect(!repo_file_path.is_repo_file_path(".."));
    try std.testing.expect(!repo_file_path.is_repo_file_path("../outside.txt"));
    try std.testing.expect(!repo_file_path.is_repo_file_path("docs/../../outside.txt"));
    try std.testing.expect(!repo_file_path.is_repo_file_path("docs\\..\\..\\outside.txt"));
    try std.testing.expect(!repo_file_path.is_repo_file_path("docs/.."));
}

test "is_separator finds both slashes and no other character" {
    try std.testing.expect(repo_file_path.is_separator('/'));
    try std.testing.expect(repo_file_path.is_separator('\\'));
    try std.testing.expect(!repo_file_path.is_separator('.'));
    try std.testing.expect(!repo_file_path.is_separator('a'));
}
