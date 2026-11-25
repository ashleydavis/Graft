# Style guide

The Graft style guide shows what Graft should look like. Use the local copy: the repo at `../../style-guide` from the project checkout, beside the playbook clone. It sets the design tokens (colours, sizes, fonts and the like) in `graft.css`, the rules for which token to use when in `style-guide.md` and the UX rules for how the interface behaves and is laid out in `ux-rules.md`. Its style explorer, the web app whose page is `index.html` in that repo, shows every token and component in both themes. The style guide's `README.md` gives the commands that start the explorer.

## Style guide rules

These apply to every change.

- Don't add features to Graft just because they are in the style guide. The style guide shows components and pages for features Graft may later grow, and Graft grows only by the features its tickets ask for.
- Every feature you are asked to add or change follows the standard set in the style guide: its design tokens, its rules for using them and its UX rules. This keeps every part of Graft looking and behaving the same way.
- The style guide gives every style a light and a dark version. The light/dark mode rule in [coding-style.md](coding-style.md) sets which of them Graft uses.
- Every pane that can be closed has a close button in its header.
- Clicking an item in a pane that opens a new pane makes the new pane the active pane.
- Moving between the items of a pane with Up and Down leaves that pane active, even when the move opens or changes a pane to its right.
