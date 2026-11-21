//
// Gives the commit list's scrolling area a height in jsdom, which lays out no page and so reports
// every element as 0 pixels tall, so the virtual list draws the rows a window of that height shows
// and a test can check which rows it draws, when it reads the next page and where it scrolls.
//

//
// The height in pixels the commit list's scrolling area reports: room for ten 36 pixel rows.
//
export const FAKE_LIST_HEIGHT_PX = 360;

//
// Makes every element with the data-id commit-list-scroll report FAKE_LIST_HEIGHT_PX as its
// clientHeight and the height of the list in it as its scrollHeight, and puts a Jest mock on every
// element's scrollTo, which jsdom leaves undefined, that sets scrollTop and sends the scroll event
// a browser sends. Returns the scrollTo mock and a function that puts them back as jsdom had them.
//
export function installFakeListLayout(): IFakeListLayout {
    const scrollTo = jest.fn(function scrollToTop(this: HTMLElement, options: ScrollToOptions) {
        this.scrollTop = options.top ?? 0;
        this.dispatchEvent(new Event("scroll"));
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
        configurable: true,
        get(this: HTMLElement): number {
            if (this.getAttribute("data-id") === "commit-list-scroll") {
                return FAKE_LIST_HEIGHT_PX;
            }
            return 0;
        },
    });
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
        configurable: true,
        get(this: HTMLElement): number {
            if (this.getAttribute("data-id") === "commit-list-scroll") {
                return listHeightPx(this);
            }
            return 0;
        },
    });
    Object.defineProperty(Element.prototype, "scrollTo", {
        configurable: true,
        writable: true,
        value: scrollTo,
    });
    return {
        scrollTo,
        uninstall(): void {
            Reflect.deleteProperty(HTMLElement.prototype, "clientHeight");
            Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight");
            Reflect.deleteProperty(Element.prototype, "scrollTo");
        },
    };
}

//
// Reads the height in pixels the virtual list in the scrolling area sets on itself, which is how
// far the area scrolls in a browser, or 0 while the list is not drawn.
//
export function listHeightPx(scrollArea: HTMLElement): number {
    const list = scrollArea.firstElementChild;
    if (!(list instanceof HTMLElement)) {
        return 0;
    }
    return parseFloat(list.style.height);
}

//
// The fake layout installFakeListLayout puts in place.
//
export interface IFakeListLayout {
    // The mock on every element's scrollTo, which records where the list scrolled.
    scrollTo: jest.Mock;

    // Puts clientHeight, scrollHeight and scrollTo back as jsdom had them.
    uninstall(): void;
}
