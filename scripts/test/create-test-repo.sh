#!/usr/bin/env bash

#
# Creates the test repo Graft reads, in a known state: a few commits with fixed authors, dates and
# messages, so every run makes the same commits with the same hashes. See create-test-repo.md.
#

set -eu

#
# The repo the app reads when no smoke test gives it a path of its own.
#
DEFAULT_REPO_PATH="/tmp/graft/test-repo"

#
# The file that marks a repo as one this script made, so the script deletes only its own repos.
#
MARKER_NAME="graft-test-repo"

if [ "$#" -gt 1 ]; then
    echo "Usage: create-test-repo.sh [path]" >&2
    echo "Creates the test repo at the path, or at $DEFAULT_REPO_PATH when no path is given." >&2
    exit 2
fi

if [ "$#" -eq 0 ]; then
    echo "Usage: create-test-repo.sh [path]"
    echo "No path was given, so the test repo is created at $DEFAULT_REPO_PATH."
    REPO_PATH="$DEFAULT_REPO_PATH"
else
    REPO_PATH="$1"
fi

if [ -e "$REPO_PATH" ]; then
    if [ ! -f "$REPO_PATH/.git/$MARKER_NAME" ]; then
        echo "$REPO_PATH already exists and was not made by this script, so it is left alone. Give a path that does not exist." >&2
        exit 1
    fi
    rm -rf "$REPO_PATH"
fi

mkdir -p "$REPO_PATH"

#
# The user's own git config and hooks would change the commits, so git runs with an empty global
# config and the system config switched off, and the repo is made from an empty template.
#
export GIT_CONFIG_GLOBAL=/dev/null
export GIT_CONFIG_NOSYSTEM=1
export GIT_AUTHOR_NAME="Ada Author"
export GIT_AUTHOR_EMAIL="ada@example.com"
export GIT_COMMITTER_NAME="Cy Committer"
export GIT_COMMITTER_EMAIL="cy@example.com"

git init --quiet --initial-branch=main --template= "$REPO_PATH"
touch "$REPO_PATH/.git/$MARKER_NAME"

#
# Writes the text to the file in the repo and commits it with the message at the date.
# Usage: commit_file <file> <text> <date> <message> [description]
#
commit_file() {
    printf '%s\n' "$2" > "$REPO_PATH/$1"
    git -C "$REPO_PATH" add "$1"
    if [ "$#" -eq 5 ]; then
        GIT_AUTHOR_DATE="$3" GIT_COMMITTER_DATE="$3" git -C "$REPO_PATH" commit --quiet --message "$4" --message "$5"
    else
        GIT_AUTHOR_DATE="$3" GIT_COMMITTER_DATE="$3" git -C "$REPO_PATH" commit --quiet --message "$4"
    fi
}

commit_file "README.md" "# Test repo" "2026-01-01T09:00:00+00:00" "Add the readme"
commit_file "notes.txt" "The first note." "2026-01-02T09:00:00+00:00" "Add the notes"
git -C "$REPO_PATH" tag v1.0
commit_file "notes.txt" "The second note." "2026-01-03T09:00:00+00:00" "Change the note" "The note now says what the second note is."

echo "Created the test repo at $REPO_PATH:"
git -C "$REPO_PATH" log --oneline --decorate
