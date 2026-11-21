//
// The Git interface: the one function that starts `git`. Every Git operation in Graft goes through
// it, so a test can give the code above it a mock in its place, and it sends the frontend an
// event naming each command it ran and how long it took, so the help panel shows every Git command
// Graft runs.
//

const std = @import("std");
const ziggy = @import("ziggy");

const assert = std.debug.assert;
const TaskServices = ziggy.task_runner.TaskServices;

//
// What `git` reported when it ended. The caller owns `stdout` and `stderr` and frees them with the
// allocator it passed.
//
pub const GitResult = struct {
    //
    // The code `git` exited with, or null when it ended without exiting, such as when a signal
    // killed it. Zero means it succeeded.
    //
    exit_code: ?u8,

    //
    // Everything `git` wrote to its standard output.
    //
    stdout: []const u8,

    //
    // Everything `git` wrote to its standard error.
    //
    stderr: []const u8,
};

//
// One Git command a wrapper runs: the repo it runs in and the arguments Graft starts git with. The
// help panel shows the command `shown_args` derives from the arguments, so each wrapper writes its
// arguments once.
//
pub const GitCommand = struct {
    //
    // The path of the repo git runs in. Graft passes it with `-C` and the help panel shows it as
    // `cd <repo>` above the command.
    //
    repo_path: []const u8,

    //
    // The arguments after `git -C <repo>` that Graft starts git with.
    //
    args: []const []const u8,
};

//
// The event `run_git` sends the frontend for each command it ran. The field names are camelCase
// because Ziggy turns the struct into the JSON the frontend reads.
//
pub const GitCommandEvent = struct {
    //
    // What the event is, so the frontend can pick it out from the other events a task sends.
    //
    type: []const u8,

    //
    // The `cd` command that moves a terminal into the repo, quoted for a shell.
    //
    directoryCommand: []const u8,

    //
    // The Git command as the help panel shows it, quoted for a shell.
    //
    command: []const u8,

    //
    // How long `git` ran, from just before it started to just after it ended, in whole
    // milliseconds, so the help panel shows what each command cost the page.
    //
    durationMs: u64,
};

//
// The type of the Git interface function: starts `git`, sends the frontend the command and how
// long it took, and reports how it ended. A plain function pointer, so the code that runs Git
// takes `run_git` itself as an argument, and a unit test passes a mock instead.
//
pub const RunGit = *const fn (
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    command: GitCommand,
) anyerror!GitResult;

//
// The Git interface function. Starts `git -C <repo>` with the command's arguments through
// `start_git`, timing it on the awake clock, which never jumps when the system time is changed.
// Then it sends the task's event naming the command as the help panel shows it, with how long git
// ran, so the event is sent once the duration is known. Everything it allocates for the event is
// freed before it returns. When the event cannot be sent, it frees git's output and returns the
// error.
//
pub fn run_git(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    command: GitCommand,
) anyerror!GitResult {
    assert(command.repo_path.len > 0);
    assert(command.args.len > 0);

    const argv = try allocator.alloc([]const u8, command.args.len + 2);
    defer allocator.free(argv);

    argv[0] = "-C";
    argv[1] = command.repo_path;
    @memcpy(argv[2..], command.args);
    assert(argv.len == command.args.len + 2);
    const started = std.Io.Clock.awake.now(io);

    const result = try start_git(io, allocator, argv);
    errdefer allocator.free(result.stdout);
    errdefer allocator.free(result.stderr);

    const ended = std.Io.Clock.awake.now(io);
    try send_git_command_event(
        io,
        services,
        allocator,
        command,
        elapsed_milliseconds(.{
            .start = started,
            .end = ended,
        }),
    );
    return result;
}

//
// Two readings of the awake clock, taken just before `git` starts and just after it ends. They are
// named fields, so each call says which reading is the start and which is the end.
//
pub const ClockReadings = struct {
    //
    // The reading taken just before `git` starts.
    //
    start: std.Io.Timestamp,

    //
    // The reading taken just after `git` ends, never earlier than `start`.
    //
    end: std.Io.Timestamp,
};

//
// Works out the whole milliseconds from the start reading to the end reading, rounded down, for
// the duration `run_git` sends with each command. Both come from the awake clock, which never goes
// backwards.
//
pub fn elapsed_milliseconds(readings: ClockReadings) u64 {
    assert(readings.end.nanoseconds >= readings.start.nanoseconds);

    const nanoseconds = readings.start.durationTo(readings.end).nanoseconds;
    assert(nanoseconds >= 0);
    return @intCast(@divFloor(nanoseconds, std.time.ns_per_ms));
}

//
// Sends the event naming the command and how long it ran, so the help panel shows the `cd` into
// the repo, the command a user can paste into a terminal there and its duration.
//
pub fn send_git_command_event(
    io: std.Io,
    services: TaskServices,
    allocator: std.mem.Allocator,
    command: GitCommand,
    duration_ms: u64,
) !void {
    var arena_state = std.heap.ArenaAllocator.init(allocator);
    defer arena_state.deinit();

    const arena = arena_state.allocator();
    const event = try git_command_event(arena, command, duration_ms);
    assert(event.durationMs == duration_ms);
    assert(std.mem.startsWith(u8, event.command, "git "));
    try services.sendEvent(io, arena, event);
}

//
// Builds the event for the command: `cd <repo>` and `git <shown arguments>`, each quoted for a
// shell and allocated with the allocator, and how long git ran.
//
pub fn git_command_event(
    allocator: std.mem.Allocator,
    command: GitCommand,
    duration_ms: u64,
) !GitCommandEvent {
    assert(command.repo_path.len > 0);
    assert(command.args.len > 0);

    const shown = try shown_args(allocator, command.args);
    defer allocator.free(shown);

    const shown_words = try allocator.alloc([]const u8, shown.len + 1);
    defer allocator.free(shown_words);

    shown_words[0] = "git";
    @memcpy(shown_words[1..], shown);
    return .{
        .type = "git-command",
        .directoryCommand = try format_command_line(allocator, &.{
            "cd",
            command.repo_path,
        }),
        .command = try format_command_line(allocator, shown_words),
        .durationMs = duration_ms,
    };
}

//
// Works out the arguments the help panel shows after `git` from the arguments Graft runs: the
// same arguments without `-z` and without a `--format` that writes bytes by their hex code (`%x`),
// which Graft adds only to read git's output, so the command shown prints git's own output when
// pasted into a terminal. The arguments from `--` on are paths, so they are all shown, even one
// named `-z`. The list is allocated with the allocator, and its words point into `args`.
//
pub fn shown_args(allocator: std.mem.Allocator, args: []const []const u8) ![]const []const u8 {
    assert(args.len > 0);

    var path_index: u32 = @intCast(args.len);
    var parser_count: u32 = 0;
    for (args, 0..) |arg, index| {
        if (std.mem.eql(u8, arg, "--")) {
            path_index = @intCast(index);
            break;
        }
        if (is_parser_arg(arg)) {
            parser_count += 1;
        }
    }
    assert(parser_count < path_index);

    const shown = try allocator.alloc([]const u8, args.len - parser_count);
    var shown_count: u32 = 0;
    for (args[0..path_index]) |arg| {
        if (!is_parser_arg(arg)) {
            shown[shown_count] = arg;
            shown_count += 1;
        }
    }
    @memcpy(shown[shown_count..], args[path_index..]);
    assert(shown_count == path_index - parser_count);
    assert(shown.len > 0);
    return shown;
}

//
// Checks whether the argument is one Graft adds only so it can read git's output: `-z`, or a
// `--format` that writes bytes by their hex code (`%x`), which is how Graft writes the separator
// characters between fields. `shown_args` calls it to leave those arguments out of the command
// the help panel shows.
//
pub fn is_parser_arg(arg: []const u8) bool {
    assert(arg.len > 0);

    if (std.mem.eql(u8, arg, "-z")) {
        return true;
    }
    if (std.mem.startsWith(u8, arg, "--format=")) {
        return std.mem.indexOf(u8, arg, "%x") != null;
    }
    return false;
}

//
// Joins the words into one command line, with spaces between them and each word quoted for a
// POSIX shell where it needs to be, so the line runs the same words when pasted into a terminal.
// The line is allocated with the allocator.
//
pub fn format_command_line(allocator: std.mem.Allocator, words: []const []const u8) ![]const u8 {
    assert(words.len > 0);

    var line: std.ArrayList(u8) = .empty;
    errdefer line.deinit(allocator);

    for (words, 0..) |word, index| {
        if (index > 0) {
            try line.append(allocator, ' ');
        }
        try append_shell_word(allocator, &line, word);
    }
    assert(line.items.len >= words.len);
    return try line.toOwnedSlice(allocator);
}

//
// Appends the word as a shell reads it: as it is when every character is one a shell leaves
// alone, and otherwise inside single quotes, with each single quote in it written as `'\''`.
//
pub fn append_shell_word(
    allocator: std.mem.Allocator,
    line: *std.ArrayList(u8),
    word: []const u8,
) !void {
    const length_before = line.items.len;
    if (is_plain_shell_word(word)) {
        try line.appendSlice(allocator, word);
    } else {
        try line.append(allocator, '\'');
        for (word) |character| {
            if (character == '\'') {
                try line.appendSlice(allocator, "'\\''");
            } else {
                try line.append(allocator, character);
            }
        }
        try line.append(allocator, '\'');
    }
    assert(line.items.len >= length_before + word.len);
}

//
// Whether a shell reads the word as it is: it has at least one character and every character is
// a letter, a digit or one of `-_./=:,+@%`, which a POSIX shell reads as plain text.
//
pub fn is_plain_shell_word(word: []const u8) bool {
    if (word.len == 0) {
        return false;
    }
    for (word) |character| {
        if (!std.ascii.isAlphanumeric(character)) {
            if (std.mem.indexOfScalar(u8, "-_./=:,+@%", character) == null) {
                return false;
            }
        }
    }
    assert(word.len > 0);
    return true;
}

//
// Starts `git` (found on PATH) with the arguments, waits for it to end and reports its exit code,
// standard output and standard error. A `git` that exits with an error still returns its result,
// and the caller reads the exit code, because what a failure means depends on the command. The
// function returns an error when it fails to start `git`.
//
pub fn start_git(
    io: std.Io,
    allocator: std.mem.Allocator,
    args: []const []const u8,
) anyerror!GitResult {
    assert(args.len > 0);

    const argv = try allocator.alloc([]const u8, args.len + 1);
    defer allocator.free(argv);

    argv[0] = "git";
    @memcpy(argv[1..], args);
    const result = try std.process.run(allocator, io, .{
        .argv = argv,
        .stdout_limit = .unlimited,
        .stderr_limit = .unlimited,
        .cwd = .inherit,
        .environ_map = null,
        .create_no_window = true,
        .timeout = .none,
    });
    const exit_code: ?u8 = if (result.term == .exited) result.term.exited else null;
    if (exit_code != null) assert(result.term == .exited);
    assert(argv.len == args.len + 1);
    return .{
        .exit_code = exit_code,
        .stdout = result.stdout,
        .stderr = result.stderr,
    };
}
