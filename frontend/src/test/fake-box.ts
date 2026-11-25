//
// Makes the box getBoundingClientRect returns for an element of a given width, because jsdom lays
// out no page and has no DOMRect, so the tests of the resize handles can give a pane a width.
//

//
// Makes the box of an element at the window's top left with the width given, as a plain object.
//
export function boxOfWidth(width: number): DOMRect {
    return {
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        width,
        height: 500,
        right: width,
        bottom: 500,
        toJSON(): string {
            return "";
        },
    };
}
