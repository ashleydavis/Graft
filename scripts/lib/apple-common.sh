#!/usr/bin/env bash

# Shared by the MacOS scripts of Graft. It is sourced, never run. See apple-common.md.

APPLE_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPLE_EXAMPLE_DIR="$(cd "$APPLE_LIB_DIR/../.." && pwd)"

# Prints an error and stops the calling script.
apple_fail() {
    echo "ERROR: $*" >&2
    exit 1
}

# Stops the calling script unless it is running on MacOS.
apple_require_macos() {
    if [ "$(uname -s)" != "Darwin" ]; then
        apple_fail "this script builds with Xcode, so it runs on MacOS only. This is $(uname -s)."
    fi
}

# Stops the calling script unless every named command is on the PATH. Usage: apple_require_tool <command>...
apple_require_tool() {
    local tool
    for tool in "$@"; do
        if ! command -v "$tool" > /dev/null 2>&1; then
            apple_fail "'$tool' is not on the PATH. Install the tools the repository pins in mise.toml (mise install), and install jq and Xcode's command line tools if they are missing."
        fi
    done
}

# Stops the calling script unless xcodebuild works.
apple_require_xcode() {
    apple_require_tool xcodebuild xcrun
    if ! xcodebuild -version > /dev/null 2>&1; then
        apple_fail "xcodebuild does not work. Install Xcode and select it with xcode-select."
    fi
}

# Prints the version in apps/graft/package.json.
apple_package_version() {
    apple_require_tool jq
    jq -r '.version' "$APPLE_EXAMPLE_DIR/package.json"
}

# Prints the architecture of this Mac in the names Xcode uses: arm64 or x86_64.
apple_host_arch() {
    local machine
    machine="$(uname -m)"
    case "$machine" in
        arm64|x86_64)
            printf '%s\n' "$machine"
            ;;
        *)
            apple_fail "unknown Mac architecture '$machine'."
            ;;
    esac
}

# Prints Zig's name for an Xcode architecture name. Usage: apple_zig_arch <arm64|x86_64>
apple_zig_arch() {
    case "$1" in
        arm64)
            printf 'aarch64\n'
            ;;
        x86_64)
            printf 'x86_64\n'
            ;;
        *)
            apple_fail "unsupported architecture '$1'. Use arm64 or x86_64."
            ;;
    esac
}

# Bundles the template's frontend and builds the Zig static library, which embeds the frontend, so an Xcode build has
# everything it links. <native_dir> gets lib/libgraft.a and include/ziggy.h.
# Usage: apple_sync_native <zig_target> <native_dir> <yes|no test hooks> <zig optimize mode>
apple_sync_native() {
    local zig_target="$1"
    local native_dir="$2"
    local test_hooks="$3"
    local optimize="$4"
    apple_require_tool bun zig rsync xcrun
    echo "Bundling the UI..."
    (cd "$APPLE_EXAMPLE_DIR" && bun run bundle:ui) || apple_fail "bundling the UI failed."
    echo "Building the Zig library for $zig_target (optimize $optimize, test hooks $test_hooks)..."
    if [ "$test_hooks" = "yes" ]; then
        (cd "$APPLE_EXAMPLE_DIR" && zig build graft-backend -Dtarget="$zig_target" -Doptimize="$optimize" -Dtest-hooks=true -p "$native_dir") || apple_fail "the Zig build failed."
    else
        (cd "$APPLE_EXAMPLE_DIR" && zig build graft-backend -Dtarget="$zig_target" -Doptimize="$optimize" -p "$native_dir") || apple_fail "the Zig build failed."
    fi
    # A workaround for a bug in Zig 0.16.0, which is the pinned version. Its archive writer puts the contents of a long-named
    # member at an offset that is not a multiple of 8, and Xcode 26's linker refuses such an archive: the macOS jobs of
    # Graft workflow failed with "ld: 64-bit mach-o member 'libgraft_zcu.o' not 8-byte aligned in
    # '.../lib/libgraft.a'". The fix is on Zig's master (ziglang/zig issue 35280) and will not reach 0.16.x. Writing the
    # archive again with libtool straight from Zig's archive did not work: libtool warned "64-bit mach-o member
    # 'libgraft_zcu.o' not 8-byte aligned" and left that member's symbols out, so the link then failed with undefined
    # _ziggy_* symbols. So the members are taken out of the archive as files, and libtool writes a new archive from those, which
    # puts every member at an aligned offset.
    echo "Aligning the members of the Zig library..."
    local library="$native_dir/lib/libgraft.a"
    local members_dir
    members_dir="$(mktemp -d "$native_dir/members.XXXXXX")" || apple_fail "could not make a directory for the library's members."
    (cd "$members_dir" && xcrun ar x "$library") || apple_fail "could not take the members out of the Zig library."
    # ar x gives each file the mode stored in Zig's archive, which leaves it unreadable: the macOS job of Graft
    # workflow logged "libtool: warning: cannot open() '.../members.CzH9Kq/compiler_rt.o', errno=13" (EACCES) for each member
    # and the link then failed with undefined _ziggy_* symbols.
    chmod u+rw "$members_dir"/*.o || apple_fail "could not make the Zig library's members readable."
    xcrun libtool -static -o "$library.aligned" "$members_dir"/*.o || apple_fail "libtool could not write the Zig library again."
    mv "$library.aligned" "$library" || apple_fail "could not replace the Zig library with the aligned one."
    find "$members_dir" -type f -delete
    find "$members_dir" -depth -type d -empty -delete
}
