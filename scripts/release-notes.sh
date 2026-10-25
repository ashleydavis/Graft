#!/usr/bin/env bash
# Prints the release notes for a build: one bullet per commit made since the last release tag.
#
# Used by the release workflows, which list the commits in the GitHub release of Graft.
#
# Nothing is written and nothing but the notes goes to stdout, so a caller can capture it directly.
#
# Usage: scripts/release-notes.sh [options]
#   --prefix <word>          Keep only commits whose subject starts with "<word>:", and strip that
#                            prefix from the bullet. Without it, every commit is listed.
#   --exclude-tag <tag>      Ignore this tag when looking for the last release tag. The workflow
#                            passes the tag it is building, so a tagged release reports what changed
#                            since the tag before it rather than nothing at all.
#   --empty-message <text>   What to print when no commit matches (default: "- No changes found").
set -euo pipefail

# git reads the repository the script is in, wherever it is called from.
cd "$(dirname "${BASH_SOURCE[0]}")"

PREFIX=""
EXCLUDE_TAG=""
EMPTY_MESSAGE="- No changes found"

while [ $# -gt 0 ]; do
    case "$1" in
        --prefix)
            PREFIX="$2"
            shift 2
            ;;
        --exclude-tag)
            EXCLUDE_TAG="$2"
            shift 2
            ;;
        --empty-message)
            EMPTY_MESSAGE="$2"
            shift 2
            ;;
        *)
            echo "ERROR: unknown argument '$1'. Options: --prefix, --exclude-tag, --empty-message." >&2
            exit 1
            ;;
    esac
done

# The last version tag of Ziggy, newest first by version number. The template tag is skipped
# because it moves with every published build of the template, so measuring from it would report almost nothing.
LAST_TAG=""
while IFS= read -r tag; do
    if [ "$tag" = "template" ]; then
        continue
    fi
    if [ -n "$EXCLUDE_TAG" ] && [ "$tag" = "$EXCLUDE_TAG" ]; then
        continue
    fi
    LAST_TAG="$tag"
    break
done < <(git tag --list --sort=-version:refname)

# With no tag to measure from (a fresh clone with none fetched, or a repository that has never been
# tagged) the whole history is the range, which is the most that can honestly be said about it.
COMMIT_RANGE=""
if [ -n "$LAST_TAG" ]; then
    COMMIT_RANGE="$LAST_TAG..HEAD"
    echo "Release notes for commits since $LAST_TAG." >&2
else
    echo "Release notes for the whole history: no release tag to measure from." >&2
fi

if [ -n "$COMMIT_RANGE" ]; then
    SUBJECTS="$(git log --no-merges --format='%s' "$COMMIT_RANGE")"
else
    SUBJECTS="$(git log --no-merges --format='%s')"
fi

NOTES=""
while IFS= read -r subject; do
    if [ -z "$subject" ]; then
        continue
    fi
    if [ -n "$PREFIX" ]; then
        case "$subject" in
            "$PREFIX:"*)
                subject="${subject#"$PREFIX":}"
                ;;
            *)
                continue
                ;;
        esac
    fi

    # Trim the space left behind by a stripped prefix, and any the commit message itself carried.
    subject="$(printf '%s' "$subject" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    if [ -z "$subject" ]; then
        continue
    fi

    NOTES="$NOTES- $subject"$'\n'
done <<< "$SUBJECTS"

if [ -z "$NOTES" ]; then
    echo "$EMPTY_MESSAGE"
    exit 0
fi

printf '%s' "$NOTES"
