# apple-common

`lib/apple-common.sh` is the shell library the MacOS scripts source. It is never run. It holds the checks (`apple_require_macos`, `apple_require_tool`, `apple_require_xcode`), the version and architecture helpers, `apple_sync_native` (bundle the frontend, build the Zig static library and write it again with Apple's `libtool` so every member is 8-byte aligned, which Xcode 26's linker needs and Zig 0.16.0's archive writer does not do and copy the frontend into the native directory).

It is sourced from the script's own directory: `source "$SCRIPT_DIR/lib/apple-common.sh"`. It takes no arguments of its own.
