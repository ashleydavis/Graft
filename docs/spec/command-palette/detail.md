# Command palette

## Overview

The command palette is a dialog near the top of Graft's window, laid out as the style guide's command palette: a search box over a list of commands. It is built from Ziggy's action list and runs the picked command as an action. It lists the commands relevant to the selected pane or page first.

## Behaviour

- Showing the palette is Graft's Command Palette action, a Ziggy action named `show-command-palette` with the shortcut `CmdOrCtrl+Shift+P`: Ctrl+Shift+P on Linux and Windows and Cmd+Shift+P on macOS. It works from any page, and from a text box too, such as the breadcrumb trail drop-down's search box, which keeps its text as it was. The shortcut is kept clear of the web view's own keys, as `backend/src/test/actions.test.zig` checks.
- The palette opens over the page near the top, with the page behind it dimmed. The search box at its top has the placeholder "Type a command" and the focus.
- The list holds every action and standard menu item `window.ziggy.listActions()` gives, in the order Ziggy lists them, except the palette's own action. Each row shows the command's label and, when it has one, its shortcut as key caps.
- The selected pane or page is the active pane while the repo explorer page shows one, and the page shown everywhere else. The commands relevant to it are listed first, under a heading naming it (such as "Welcome page" or "Commit pane"), and every other command follows under "Other commands", as the style guide's keyboard shortcuts overlay groups its shortcuts. A heading shows only over a group that has commands.
- Which actions are relevant to each pane and page is kept in one table in the frontend, by action name (`RELEVANT_ACTIONS` in `frontend/src/lib/command-palette.ts`):
  - Welcome page: Open repo, New window.
  - About page: Copy.
  - Help page: Keyboard Shortcuts.
  - Repo explorer page with no repo open: Open repo.
  - Repo details pane: Open repo, New window.
  - Commit pane and commit details pane: Copy, Select All.
  - File pane (of a commit or of a changed file): Copy, Select All, Zoom In, Zoom Out, Actual Size.
  - Changes pane: Undo, Redo, Cut, Copy, Paste, Select All.
- Typing filters both groups to the commands whose label contains the text, ignoring case. When none matches, the palette shows `No command matches "<text>".`
- The first command listed is highlighted. Up and Down move the highlight, and moving the mouse over a row highlights it. Enter runs the highlighted command and a click runs the clicked one. Running a command closes the palette.
- Escape or a click outside the palette closes it and runs no command. The search is cleared each time the palette closes.
- When Ziggy cannot give the action list, the palette shows why in place of the list. When Ziggy cannot run a command, the palette opens again and shows why.
- The palette follows the Graft style guide in the light and dark themes.

## Acceptance criteria

- [x] Showing the palette is a Ziggy action declared in the backend with the shortcut `CmdOrCtrl+Shift+P`, so it is Ctrl+Shift+P on Linux and Windows and Cmd+Shift+P on macOS, and it works from any page, also while a text box has the focus.
- [x] The shortcut is kept clear of the web view's own keys, as `backend/src/test/actions.test.zig` checks.
- [x] The palette opens over the page near the top, with the page behind it dimmed, laid out as the style guide's command palette: a search box with the placeholder "Type a command" that has the focus, and a list of commands under it, each row with the command's label and, when it has one, its shortcut as key caps.
- [x] The list holds every action and standard menu item from `window.ziggy.listActions()`, except the palette's own action.
- [x] The commands relevant to the active pane or page are listed first, under a heading naming that pane or page, and every other command follows under a heading of its own.
- [x] Which actions are relevant to each pane and page is kept in one table in the frontend, by action name.
- [x] Typing filters the list to the commands whose label contains the text, ignoring case, in both groups. When none matches, the palette shows "No command matches "<text>"."
- [x] The first command listed is highlighted. Up and Down move the highlight. Enter runs the highlighted command and a click runs the clicked one. Running a command closes the palette.
- [x] Escape closes the palette and runs no command. The search is cleared each time the palette closes.
- [x] When `listActions` fails, the palette shows why in place of the list. When `runAction` fails, the palette shows why.
- [x] The palette follows the Graft style guide in the light and dark themes.

## Open questions

None.
