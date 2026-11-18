//
// The style that marks the commit explorer's active pane: its border in the style guide's active
// pane colour, so the user sees which pane the keys act on.
//

//
// The Tailwind classes of the active pane's card: a border and a ring in graft.css's
// --color-select-pane over the raised shadow. Tests look for them to read which pane is active.
//
export const activePaneClasses = "border-[var(--color-select-pane)] shadow-[0_0_0_1px_var(--color-select-pane),var(--shadow-raised)]";

//
// The Tailwind classes of a pane's card that is not active: a border in graft.css's --color-border
// over the raised shadow.
//
export const inactivePaneClasses = "border-[var(--color-border)] shadow-[var(--shadow-raised)]";

//
// Picks the Tailwind classes of a pane's card border for whether the pane is active, so the
// commit pane, the commit details pane and the file pane mark the active pane the same way. The
// colours are CSS variables, so they follow the light and dark themes.
//
export function activePaneClass(isActive: boolean): string {
    if (isActive) {
        return activePaneClasses;
    }
    return inactivePaneClasses;
}

//
// The Tailwind classes of the file pane's card while it is active: a border and a ring in
// graft.css's --color-select-pane alone, as the style guide's file diff card is drawn.
//
export const activeFlatPaneClasses = "border-[var(--color-select-pane)] shadow-[0_0_0_1px_var(--color-select-pane)]";

//
// The Tailwind class of the file pane's card while it is not active: a border in graft.css's
// --color-border alone, as the style guide's file diff card is drawn.
//
export const inactiveFlatPaneClasses = "border-[var(--color-border)]";

//
// Picks the Tailwind classes of the file pane's card border for whether the pane is active. It
// marks the active pane with the same border and ring as activePaneClass, so the user sees the same
// mark on every pane. The card keeps to its border, as the style guide's file diff card does, where
// the other panes add the raised shadow.
//
export function activeFlatPaneClass(isActive: boolean): string {
    if (isActive) {
        return activeFlatPaneClasses;
    }
    return inactiveFlatPaneClasses;
}
