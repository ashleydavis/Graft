//
// Checks a file path the frontend sends for the changes pane's tasks before git reads it, so git
// reads and changes files inside the open repo only.
//

const std = @import("std");

const assert = std.debug.assert;

//
// Whether the path names a file inside the repo, relative to the repo's root: it has text, starts
// with neither `/` nor `\`, has no drive letter (`C:`) and has no `..` part between its slashes.
// `git diff --no-index` reads any file it is given, so the changes pane's untracked file diff
// would otherwise read a file outside the repo. Git writes paths with `/`, and both slashes are
// checked because Windows reads `\` as a separator too.
//
pub fn is_repo_file_path(path: []const u8) bool {
    if (path.len == 0) {
        return false;
    }
    if (is_separator(path[0])) {
        return false;
    }
    if (path.len >= 2) {
        if (path[1] == ':') {
            return false;
        }
    }
    assert(path.len > 0);

    var part_start: usize = 0;
    for (path, 0..) |character, index| {
        if (is_separator(character)) {
            if (std.mem.eql(u8, path[part_start..index], "..")) {
                return false;
            }
            part_start = index + 1;
        }
    }
    assert(part_start <= path.len);
    return !std.mem.eql(u8, path[part_start..], "..");
}

//
// Whether the character separates the parts of a path on Linux, macOS or Windows.
//
pub fn is_separator(character: u8) bool {
    if (character == '/') {
        return true;
    }
    return character == '\\';
}
