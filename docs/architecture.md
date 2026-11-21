# Graft architecture

How Graft is built: its parts, how they fit together and why. For how to set up and develop it, see [development.md](development.md). For what it does, see the spec in [spec/](spec/README.md).

## Overview

Graft is a Ziggy app. A React frontend runs in the system web view and holds most of the code. A Zig backend does everything that touches Git, the file system or the computer. A native app for each platform opens the window, hosts the web view and carries messages between the two. The split is the line between what can be drawn and decided in the page and what has to reach outside it: the frontend asks, the backend does the work and answers.

High level overview of the project:

```mermaid
flowchart LR
    user[User] --> frontend[Frontend<br/>React in the system web view]
    frontend -- messages and tasks<br/>window.ziggy --> native[Native app<br/>window, web view, menu, dialogs]
    native -- message bridge --> main[Backend main thread<br/>message handlers]
    main -- queues --> workers[Backend worker threads<br/>tasks]
    workers -- runs --> git[git]
    workers --> fs[(File system)]
    main -- message responses and events --> native
    workers -- task events and results --> native
    native --> frontend
```

## Components

### Frontend

- Lives in `frontend/`. TypeScript, React, TanStack, MaterialUI, Tailwind and Font Awesome icons, bundled by Vite and embedded in the app.
- Owns everything the user sees: the pages, the layout and the state of the window. The open repo's path is part of that state, kept in `RepoContext` above the router so it stays loaded while the user moves between pages.
- Keeps its logic in plain functions under `src/lib/`, so the UI is a thin layer over unit tested code.
- The layout listens for every task's `git-command` event and keeps each page's commands and their durations by the source its tasks are queued under, for as long as the app runs, so the right sidebar's Git commands panel shows the two most recent commands of the page that is open, how long each took and the total time of every command the page keeps.
- Each feature whose action works on every page registers the action's handler in a hook of its own, such as `useOpenRepoAction`, and the layout calls one hook per feature.
- Must not reach Git, the file system or the computer. It asks the backend through `window.ziggy`.

### Backend

- Lives in `backend/`. Zig, declared to Ziggy in `backend/src/app.zig`. Each feature declares its actions, menu items, messages and tasks in its own file under `backend/src/features/`, and `app.zig`, `lib/actions.zig` and `lib/menu.zig` build Graft's lists from them, so a new feature adds a file and one line per list, and features added side by side rarely change the same lines.
- Owns every call to `git`, every file read and write and anything else that reaches the computer.
- Message handlers run on the backend's main thread and answer quickly. Anything slow is a task on a worker thread.
- Starts `git` through one Git interface function, `run_git` in `backend/src/lib/git-interface.zig`. It takes the task's services and a Git command: the repo and the arguments Graft runs. It starts `git -C <repo>` with the arguments and Graft's own environment, so git reads the user's git config, hooks and commit author as in their terminal, and times it on the awake clock, which never jumps when the system time is changed. Then it sends a `git-command` task event with `cd <repo>`, the command the help panel shows and the duration in milliseconds, with the `cd` line and the command each quoted for a POSIX shell. It returns the exit code, standard output and standard error. The event is sent after `git` ends because the duration is known only then. Every other piece of backend code that needs Git calls it.
- Wraps each Git command in a function that builds its arguments and parses its output, such as the `log` wrapper in `backend/src/lib/git-log.zig`. The Git interface function derives the command the help panel shows from the wrapper's arguments, leaving out what only Graft's parsing needs (`-z` and a `--format` with separator characters) and keeping every argument after `--`, so the command shown works pasted into a terminal in the repo. A wrapper takes the Git interface function as an argument, so its unit tests pass a mock.
- The `log` wrapper reads one page of commits at a time with `git log -z`, its fields split by the unit separator (0x1f). A later page starts from the last commit of the previous page and skips it, so a new commit on top does not shift the pages.
- The `log` wrapper also reads one commit by its hash, for the commit details pane. The `diff-tree` wrapper in `backend/src/lib/git-diff-tree.zig` reads what one commit changed with `git diff-tree`: its changed files with their line counts and the diff of one of them. Both refuse a hash that is not hexadecimal, so git reads text from the frontend only as a commit.
- The `status` wrapper in `backend/src/lib/git-status.zig` reads the working tree's staged and unstaged files with `git status --porcelain=v1 -z`. The `diff` wrapper in `backend/src/lib/git-diff.zig` reads one changed file's diff, and the `add` and `restore --staged` wrappers in `backend/src/lib/git-stage.zig` stage and unstage one file. Each passes the file's path after `--` and refuses a path that is empty, absolute or has a `..` part, so git reads and changes files inside the repo only, even with `git diff --no-index`, which reads any file it is given.
- File, Open repo runs the `open-repo` action, whose handler is in the frontend. It sends the `pick-repo-folder` message, whose response comes from a task of that name, because the system folder picker it shows waits for the user.
- The zoom actions' handlers send the backend's `zoom` message, which has the native app zoom through Ziggy's handler services. Graft can only step the native app's zoom, so Graft keeps the zoom level itself to save it in the state file.
- The repo explorer page queues one task per pane: the commits task for the commit pane, the commit details task (the commit and its changed files) for the commit details pane and the file diff task for the file pane. The changes pane queues the working changes task (git status) for its lists, the working file diff task (git diff) for a changed file's pane and the stage file and unstage file tasks (git add and git restore --staged) for its buttons, then reads the changes again.
- Must not share state between threads or use locks.

### Native apps

- Live in `native/<platform>/`, each built on the native app Ziggy provides: a Zig executable on Linux (WebKitGTK) and Windows (WebView2) and Swift on macOS (WKWebView).
- Own the window, the system web view, the desktop menu, native dialogs and the message bridge.
- Must not hold Graft's logic. They carry messages without reading them.

### Ziggy

- A dependency, locked to a release tag in `package.json` and `build.zig.zon`. It provides the core library (message bridge, task runner, remote control), the native apps and Ziggy's frontend types.
- Graft owns the code that came from the Ziggy template and changes it freely. It does not change Ziggy itself.

## How the components talk to each other

- The frontend sends a message with `window.ziggy.invoke(name, data)` and gets a message response back, or queues a task with `window.ziggy.addTask` and hears its progress through `onTaskEvent` and its end through `onTaskCompleted`.
- The native app passes each message to the backend through Ziggy's C interface. The backend's main thread finds the handler registered for its name and sends back what it returns.
- A message handler can have a task give its response, so a slow answer still reaches the frontend as one message response.
- The backend sends the frontend events of its own with `sendEvent`. The native app sends a menu item the frontend runs as a menu event.
- The backend declares Graft's actions, each in the file of the feature that owns it, and the frontend registers each one's handler with `window.ziggy.registerAction`, in a hook the feature owns. Ziggy runs an action's keyboard shortcut in the frontend. Each feature's section of the [spec](spec/index.md) describes what its actions and their shortcuts do. Ziggy's action list, which `window.ziggy.listActions()` gives, is the one list of shortcuts: the overlay is built from it, so a shortcut is written only where its action is declared. The one exception is Ctrl+/, because Ziggy's shortcut syntax refuses `/` as a key: the overlay matches it with a keydown listener of its own and adds it to the list it shows. The listener opens or closes the overlay once per hold of Control, because on some Linux desktops each repeat of a held key reaches the page as a keyup and a keydown with `repeat` false, the same as a new press. The repo explorer page handles its own keys (the arrow keys, Enter and Escape) itself while it is shown, because they mean something only there.
- Every message, response and event is the JSON text of one object.

## Where work runs

- The UI thread belongs to the native app and the web view. It only draws and passes messages on.
- The backend's main thread runs message handlers, menu functions and timers. It does quick work only, such as answering from state it already holds or queuing a task.
- Every expensive operation (running `git`, walking a folder, reading a large file, reaching the network) is a Ziggy task on the backend's pool of worker threads. A task the user is waiting on is queued as `interactive`, which puts it at the head of the queue. Everything else is `background`.
- A task gets its input as JSON when it is queued, reports with `sendEvent`, ends with its result and is cancelled by its source with `cancelTasks`. A task that loops calls `checkCancelled()` at every step.
- Threads keep their own state and talk only by messages. A lock in the code means this rule is being broken.

## Data flow

A user action that needs data from Git:

1. The frontend queues a task as `interactive` and shows that it is loading.
2. The native app passes the `add-task` message to the backend, which queues the task.
3. A worker thread runs the task. It calls the Git interface function, which starts `git` in the repo's folder and reads its output, then sends the frontend a `git-command` task event naming the command and how long it took.
4. The task parses the output and returns it as its result.
5. The native app delivers the `task-completed` event to the frontend, which renders the result.
6. If `git` fails, the task fails with an error that says what went wrong. The frontend shows it.

## User interface

Graft's UI grows one small piece at a time, one ticket at a time. Each page, button, menu and feature exists only once a ticket adds it. The Graft UI mockup guides only the general structure and style of what a ticket adds. It is never copied, and Graft may never have all of its features.

## Key design decisions

- **Ziggy, with the frontend in the system web view.** Graft gets one frontend for every desktop platform, written in TypeScript and React. Everything that reaches the computer is in Zig.
- **All access to Git, the file system and the computer goes through Zig.** The frontend only asks. The backend is the one place that touches the computer. The frontend can be unit tested without it.
- **Expensive work runs in tasks.** Rejected: running it in message handlers, because they share the main thread with every other message and a slow one would hold up the whole UI.
- **Threads share no state.** Rejected: shared state with locks. Threads that talk only by messages need no locks. Each piece of the backend's state belongs to one thread.
- **Graft runs the `git` command.** One Git interface function starts it. Every other unit test mocks that function.
- **A task handler is made with the Git interface function it runs.** Ziggy passes a task handler only its standard arguments, so `commits_task_handler` takes the Git interface function at compile time: the app registers the handler made with `run_git` and a unit test registers one made with the mock. Rejected: a global holding the function, which tests would have to swap.
- **The Git interface function sends the frontend each command it starts.** Every Git operation goes through it, so the panel lists every command Graft runs from one place. The command shown is derived from the arguments Graft runs and written as a command line in the backend, so the frontend only shows text and each wrapper writes its arguments once. Rejected: building the command line in the frontend, which would have to know each wrapper's arguments. Rejected: each wrapper writing the arguments it shows beside the arguments it runs, which kept two lists that could drift apart.
- **No Git interfaces, abstractions or mocks until a feature needs them.** Rejected: designing them upfront, which is overengineering for features that do not exist yet.
- **Graft owns the template code and depends on Ziggy.** The template is a starting point to change freely. Ziggy is upgraded with `/ziggy:upgrade`.
- **One process per window.** Several instances of Graft can run at once, for example on different virtual desktops. Each is a separate process with one window, so instances share no state in memory. File, New window starts one through Ziggy's support for new windows.

## Constraints

- Every access to Git, the file system and the computer goes through the Zig backend.
- Expensive work never runs on the backend's main thread or the UI thread.
- Threads share no state and use no locks. They talk only by messages, as JSON or binary.
- Standard services such as IO and the allocator, as well as Graft's own services, are passed to functions as parameters and are not stored in structs.
- Several instances run at once, each a separate process with one window. Anything Graft keeps on disk must allow for that.
- Graft runs on Linux, Windows and macOS (Intel and Apple silicon).
- The smoke tests drive the release build itself, started with `--remote-control`. Without that option the app opens no remote control connection.

## Similar products

- **Other Git clients.** Graft follows their conventions for commits, branches, staging and history, so it is familiar from the first use. It differs where the developer's own use shows a better way. It is customised for the developer's workflow.
- **GitHub's web pages for commits and branches.** Graft follows how they lay out a commit with its changed files and diff. It also follows how they list branches. It differs by working on the local repo through `git`, as a desktop app.

## Related docs

- [development.md](development.md): how to develop, test and contribute.
- [setup.md](setup.md): how to set up the project and a worktree.
- [spec/README.md](spec/README.md): what the system does, feature by feature.
- Ziggy's [architecture](https://github.com/ashleydavis/ziggy/blob/v0.0.25/docs/development/architecture.md): the message bridge, tasks, menus and remote control in detail.
