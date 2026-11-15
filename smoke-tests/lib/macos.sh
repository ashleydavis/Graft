#!/usr/bin/env bash

# The MacOS platform library of Graft's smoke tests. See common.sh for what it implements.
#
# The app is the built Graft.app's executable, started directly so its process group is known. Each scenario gets a
# home directory of its own (HOME and CFFIXED_USER_HOME), so the app's Application Support directory is isolated. The app
# opens a real window, so the run needs a logged-in graphical session.

# The file the app's process group is recorded in, per scenario.
MACOS_PGID_FILE_NAME="app.pgid"

# The size of the app's content area in every scenario, passed as -geometry so the window fits the macOS runner's 1024x768
# screen. The app's own 900x800 does not fit there, and macOS shrank the window to a height that changed from one start to
# the next (900x642, 900x643 and 900x645 with no zoom), so zoom-saved failed in the Release macOS arm64 workflow with "the area
# the frontend is drawn in never became 900x642. It is 900x643" after a restart. A window that fits keeps its size.
MACOS_WINDOW_SIZE="900x600"

ziggy_platform_prepare() {
    local run_dir="$1"
    local build="${ZIGGY_SMOKE_BUILD:-}"
    if [ -z "$build" ]; then
        build="$run_dir/build"
        (cd "$ZIGGY_SMOKE_APP_DIR" && bun run build:macos --configuration Release --native-dir "$build/native" --build-dir "$build/xcode") || return 1
    fi
    local built_app="$build/xcode/Build/Products/Release/Graft.app"
    if [ ! -d "$built_app" ]; then
        echo "The macOS build $build has no xcode/Build/Products/Release/Graft.app." >&2
        return 1
    fi
    mkdir -p "$run_dir/app"
    ditto "$built_app" "$run_dir/app/Graft.app" || return 1
}

ziggy_platform_start() {
    local test_dir="$1"
    local app="$ZIGGY_SMOKE_RUN_DIR/app/Graft.app/Contents/MacOS/Graft"
    local log="$test_dir/app.log"
    mkdir -p "$test_dir/home"
    local pgid
    read -r _ pgid < <(launch_in_process_group "$log" env \
        HOME="$test_dir/home" \
        CFFIXED_USER_HOME="$test_dir/home" \
        GRAFT_CONFIG_DIR="$test_dir/config" \
        GRAFT_STATE_DIR="$test_dir/state" \
        "$app" ${ZIGGY_REMOTE_CONTROL:+--remote-control "$ZIGGY_REMOTE_CONTROL"} ${ZIGGY_THEME:+--theme "$ZIGGY_THEME"} "-geometry=$MACOS_WINDOW_SIZE") || return 1
    echo "$pgid" > "$test_dir/$MACOS_PGID_FILE_NAME"
}

ziggy_platform_stop() {
    local test_dir="$1"
    if [ -f "$test_dir/$MACOS_PGID_FILE_NAME" ]; then
        kill_process_group "$(cat "$test_dir/$MACOS_PGID_FILE_NAME")" || true
    fi
}

ziggy_platform_data_dir() {
    printf '%s\n' "$1/home/Library/Application Support/au.com.codecapers.graft"
}

ziggy_platform_wait_exit() {
    local test_dir="$1"
    local seconds="$2"
    local pgid
    pgid="$(cat "$test_dir/$MACOS_PGID_FILE_NAME")"
    local waited=0
    while process_group_alive "$pgid"; do
        if [ "$waited" -ge "$((seconds * 10))" ]; then
            return 1
        fi
        sleep 0.1
        waited=$((waited + 1))
    done
}

ziggy_platform_is_running() {
    local test_dir="$1"
    process_group_alive "$(cat "$test_dir/$MACOS_PGID_FILE_NAME")"
}

#
# Succeeds when the developer tools are showing. The web inspector docks inside the window, so the frontend's area is smaller
# than it was. Usage: ziggy_platform_devtools_visible <test_dir> <the frontend's area before they opened>
#
ziggy_platform_devtools_visible() {
    [ "$(viewport_size)" != "$2" ]
}

ziggy_platform_leave_app() {
    choose_menu_item close-window
}

ziggy_platform_process_alive() {
    ziggy_platform_is_running "$1"
}
