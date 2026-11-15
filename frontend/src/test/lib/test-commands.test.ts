//
// Tests the commands the smoke tests send through the remote control connection: each command is
// performed on a fake element finder, and each result is checked, including every failure and how
// a result is turned into JSON.
//

import { elementInViewResult, IElementFinder, IFoundElement, IHorizontalBounds, performTestCommand, testResultToJson } from "../../lib/test-commands";

//
// A fake element that records what was done to it.
//
interface IFakeElement extends IFoundElement {
    // How many times it was clicked.
    clicks: number;

    // The events dispatched on it.
    events: Event[];
}

//
// The width of the window the fake finder reports, which the in-view tests place elements against.
//
const WINDOW_WIDTH = 1000;

//
// Makes a fake element with the text and value, whose edges are at the left of the window.
//
function makeElement(text: string | null, value: string | undefined): IFakeElement {
    return makePlacedElement(text, value, {
        left: 0,
        right: 100,
    });
}

//
// Makes a fake element with the text and value, whose edges are where the bounds put them, for the
// in-view command.
//
function makePlacedElement(text: string | null, value: string | undefined, bounds: IHorizontalBounds): IFakeElement {
    const element: IFakeElement = {
        textContent: text,
        value,
        clicks: 0,
        events: [],
        click(): void {
            element.clicks += 1;
        },
        focus(): void {
        },
        dispatchEvent(event: Event): boolean {
            element.events.push(event);
            return true;
        },
        getBoundingClientRect(): IHorizontalBounds {
            return bounds;
        },
    };
    return element;
}

//
// Makes a finder that finds only the element, by the data-id "target".
//
function makeFinder(element: IFoundElement): IElementFinder {
    return {
        find(dataId: string): IFoundElement | null {
            return dataId === "target" ? element : null;
        },
        windowWidth: WINDOW_WIDTH,
    };
}

describe("performTestCommand", () => {
    test("ready succeeds without an element", () => {
        expect(performTestCommand(makeFinder(makeElement("", undefined)), {
            command: "ready",
        })).toEqual({
            ok: true,
        });
    });

    test("a command with no data-id fails", () => {
        expect(performTestCommand(makeFinder(makeElement("", undefined)), {
            command: "click",
        })).toEqual({
            ok: false,
            error: "The click command needs a dataId.",
        });
    });

    test("exists says whether the element is there", () => {
        const finder = makeFinder(makeElement("", undefined));
        expect(performTestCommand(finder, {
            command: "exists",
            dataId: "target",
        })).toEqual({
            ok: true,
        });
        expect(performTestCommand(finder, {
            command: "exists",
            dataId: "missing",
        })).toEqual({
            ok: false,
        });
    });

    test("a command on a missing element fails", () => {
        expect(performTestCommand(makeFinder(makeElement("", undefined)), {
            command: "click",
            dataId: "missing",
        })).toEqual({
            ok: false,
            error: "No element has the data-id missing.",
        });
    });

    test("click clicks the element", () => {
        const element = makeElement("", undefined);
        expect(performTestCommand(makeFinder(element), {
            command: "click",
            dataId: "target",
        })).toEqual({
            ok: true,
        });
        expect(element.clicks).toBe(1);
    });

    test("type sets the value and sends an input event", () => {
        const element = makeElement("", "");
        expect(performTestCommand(makeFinder(element), {
            command: "type",
            dataId: "target",
            text: "typed",
        })).toEqual({
            ok: true,
        });
        expect(element.value).toBe("typed");
        expect(element.events.map(event => event.type)).toEqual(["input"]);
        expect(element.events[0].bubbles).toBe(true);
    });

    test("type with no text fails and changes nothing", () => {
        const element = makeElement("", "before");
        expect(performTestCommand(makeFinder(element), {
            command: "type",
            dataId: "target",
        })).toEqual({
            ok: false,
            error: "The type command needs text.",
        });
        expect(element.value).toBe("before");
        expect(element.events).toEqual([]);
    });

    test("get-value reads the value, or an empty string when there is none", () => {
        expect(performTestCommand(makeFinder(makeElement("", "a value")), {
            command: "get-value",
            dataId: "target",
        })).toEqual({
            ok: true,
            value: "a value",
        });
        expect(performTestCommand(makeFinder(makeElement("", undefined)), {
            command: "get-value",
            dataId: "target",
        })).toEqual({
            ok: true,
            value: "",
        });
    });

    test("get-text reads the text, or an empty string when there is none", () => {
        expect(performTestCommand(makeFinder(makeElement("some text", undefined)), {
            command: "get-text",
            dataId: "target",
        })).toEqual({
            ok: true,
            value: "some text",
        });
        expect(performTestCommand(makeFinder(makeElement(null, undefined)), {
            command: "get-text",
            dataId: "target",
        })).toEqual({
            ok: true,
            value: "",
        });
    });

    test("in-view succeeds when the element is inside the window and fails when it is not", () => {
        expect(performTestCommand(makeFinder(makePlacedElement("", undefined, {
            left: 400,
            right: 1000,
        })), {
            command: "in-view",
            dataId: "target",
        })).toEqual({
            ok: true,
        });
        expect(performTestCommand(makeFinder(makePlacedElement("", undefined, {
            left: 700,
            right: 1300,
        })), {
            command: "in-view",
            dataId: "target",
        })).toEqual({
            ok: false,
            error: "The element with the data-id target is outside the window: its left edge is at 700, its right edge is at 1300 and the window is 1000 wide.",
        });
    });

    test("an unknown command fails", () => {
        expect(performTestCommand(makeFinder(makeElement("", undefined)), {
            command: "dance",
            dataId: "target",
        })).toEqual({
            ok: false,
            error: "Unknown test command dance.",
        });
    });
});

describe("elementInViewResult", () => {
    test("succeeds when both edges are inside the window, including on its edges", () => {
        expect(elementInViewResult({
            left: 0,
            right: 1000,
        }, 1000, "pane")).toEqual({
            ok: true,
        });
    });

    test("rounds the edges to whole pixels", () => {
        expect(elementInViewResult({
            left: -0.4,
            right: 1000.4,
        }, 1000, "pane")).toEqual({
            ok: true,
        });
    });

    test("fails when the element starts left of the window", () => {
        expect(elementInViewResult({
            left: -10,
            right: 500,
        }, 1000, "pane")).toEqual({
            ok: false,
            error: "The element with the data-id pane is outside the window: its left edge is at -10, its right edge is at 500 and the window is 1000 wide.",
        });
    });

    test("fails when the element ends right of the window", () => {
        expect(elementInViewResult({
            left: 500,
            right: 1001,
        }, 1000, "pane")).toEqual({
            ok: false,
            error: "The element with the data-id pane is outside the window: its left edge is at 500, its right edge is at 1001 and the window is 1000 wide.",
        });
    });
});

describe("testResultToJson", () => {
    test("leaves out the fields with no value", () => {
        expect(testResultToJson({
            ok: true,
        })).toEqual({
            ok: true,
        });
    });

    test("keeps the value and the error", () => {
        expect(testResultToJson({
            ok: false,
            value: "a value",
            error: "an error",
        })).toEqual({
            ok: false,
            value: "a value",
            error: "an error",
        });
    });
});
