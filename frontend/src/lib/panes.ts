//
// Names each pane of the repo explorer, so each pane queues its tasks under its own name and the
// Git commands panel shows the commands of the active pane by that name.
//

//
// The name of the repo details pane, which shows the open repo and its links.
//
export const REPO_DETAILS_PANE = "repo-details-pane";

//
// The name of the commit pane, which lists the repo's commits.
//
export const COMMIT_PANE = "commit-pane";

//
// The name of the commit details pane, which shows the open commit and its changed files.
//
export const COMMIT_DETAILS_PANE = "commit-details-pane";

//
// The name of the file pane, which shows the diff of a file the open commit changed.
//
export const FILE_PANE = "file-pane";

//
// The name of the changes pane, which lists the working tree's unstaged and staged files and
// commits the staged ones.
//
export const CHANGES_PANE = "changes-pane";

//
// The name of the changes pane's file pane, which shows the diff of a changed file in the working
// tree.
//
export const WORKING_FILE_PANE = "working-file-pane";

//
// The name of the tag pane, which shows the open tag's details.
//
export const TAG_PANE = "tag-pane";
