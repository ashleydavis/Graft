//
// Works out how wide a pane of the repo explorer is: its own width, or the whole of the repo
// explorer while it is maximised.
//

//
// The Tailwind classes of a maximised pane's card: it grows to take the whole row of the repo
// explorer and keeps that width whatever its content, so a long diff line or commit title scrolls
// inside the card and the page stays as wide as the window.
//
export const maximisedPaneClasses = "min-w-0 flex-1";

//
// Picks the Tailwind classes of a pane card's width: the pane's own width class, kept at its full
// width, so the panes that open to its right leave it in view, or maximisedPaneClasses while it is
// maximised, so every pane fills the repo explorer the same way.
//
export function paneWidthClass(widthClass: string, isMaximised: boolean): string {
    if (isMaximised) {
        return maximisedPaneClasses;
    }
    return `${widthClass} flex-none`;
}
