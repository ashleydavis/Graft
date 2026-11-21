//
// Tests the commands the smoke tests send through the remote control connection: each command is
// performed on a fake element finder, and each result is checked, including every failure and how
// a result is turned into JSON. The type command is also performed on a text box React controls,
// to check React sees the typed value.
//

import { render } from "@testing-library/react";
import { ChangeEvent, createElement } from "react";
import { elementInsideResult, elementInViewResult, IBounds, IElementFinder, IFoundElement, performTestCommand, testResultToJson } from "../../lib/test-commands";

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
// The height of the window the fake finder reports, which the viewport test reads back.
//
const WINDOW_HEIGHT = 700;

//
// Makes a fake element with the text and value, whose edges are at the top left of the window.
//
function makeElement(text: string | null, value: string | undefined): IFakeElement {
    return makePlacedElement(text, value, {
        left: 0,
        right: 100,
        top: 0,
        bottom: 20,
    });
}

//
// Makes a fake element with the text and value, whose edges are where the bounds put them, for the
// in-view and in-view-of commands.
//
function makePlacedElement(text: string | null, value: string | undefined, bounds: IBounds): IFakeElement {
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
        getBoundingClientRect(): IBounds {
            return bounds;
        },
        scrollTop: 0,
        scrollHeight: 500,
    };
    return element;
}

//
// Makes a fake row whose top and bottom edges are where the in-view-of tests put them.
//
function placedRow(top: number, bottom: number): IFakeElement {
    return makePlacedElement("", undefined, {
        left: 0,
        right: 100,
        top,
        bottom,
    });
}

//
// Makes a finder that finds the row by the data-id "target" and, by the data-id "list", a list
// running from 100 to 400 pixels down the window, for the in-view-of tests.
//
function makeListFinder(row: IFoundElement): IElementFinder {
    const list = makePlacedElement("", undefined, {
        left: 0,
        right: 100,
        top: 100,
        bottom: 400,
    });
    return {
        find(dataId: string): IFoundElement | null {
            if (dataId === "target") {
                return row;
            }
            if (dataId === "list") {
                return list;
            }
            return null;
        },
        windowWidth: WINDOW_WIDTH,
        windowHeight: WINDOW_HEIGHT,
    };
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
        windowHeight: WINDOW_HEIGHT,
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

    test("viewport reports the window's width and height without an element", () => {
        expect(performTestCommand(makeFinder(makeElement("", undefined)), {
            command: "viewport",
        })).toEqual({
            ok: true,
            value: "1000x700",
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

    test("type changes the value of a text box React controls, so React calls its onChange", () => {
        const onChange = jest.fn();
        render(createElement("textarea", {
            "data-id": "message",
            value: "",
            onChange: (event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value),
        }));
        const finder: IElementFinder = {
            find: (dataId: string) => document.querySelector<HTMLElement>(`[data-id="${dataId}"]`),
            windowWidth: WINDOW_WIDTH,
            windowHeight: WINDOW_HEIGHT,
        };
        expect(performTestCommand(finder, {
            command: "type",
            dataId: "message",
            text: "Add the notes",
        })).toEqual({
            ok: true,
        });
        expect(onChange).toHaveBeenCalledWith("Add the notes");
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

    test("key-down dispatches a bubbling keydown of the key with Control held and returns that it was not prevented", () => {
        const element = makeElement("", "");
        expect(performTestCommand(makeFinder(element), {
            command: "key-down",
            dataId: "target",
            key: "/",
            ctrl: true,
        })).toEqual({
            ok: true,
            value: "not prevented",
        });
        expect(element.events.length).toBe(1);
        const event = element.events[0];
        expect(event).toBeInstanceOf(KeyboardEvent);
        expect(event).toHaveProperty("type", "keydown");
        expect(event).toHaveProperty("key", "/");
        expect(event).toHaveProperty("ctrlKey", true);
        expect(event).toHaveProperty("bubbles", true);
        expect(event).toHaveProperty("cancelable", true);
    });

    test("key-down without ctrl dispatches the key with Control up", () => {
        const element = makeElement("", "");
        performTestCommand(makeFinder(element), {
            command: "key-down",
            dataId: "target",
            key: "/",
        });
        expect(element.events[0]).toHaveProperty("ctrlKey", false);
    });

    test("key-down returns prevented for a key a listener kept from doing anything else", () => {
        const element = makeElement("", "");
        element.dispatchEvent = (event: Event): boolean => {
            element.events.push(event);
            return false;
        };
        expect(performTestCommand(makeFinder(element), {
            command: "key-down",
            dataId: "target",
            key: "/",
            ctrl: true,
        })).toEqual({
            ok: true,
            value: "prevented",
        });
    });

    test("key-down with no key fails and dispatches nothing", () => {
        const element = makeElement("", "");
        expect(performTestCommand(makeFinder(element), {
            command: "key-down",
            dataId: "target",
        })).toEqual({
            ok: false,
            error: "The key-down command needs a key.",
        });
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

    test("scroll-to-end scrolls the element to the end of its content", () => {
        const element = makeElement("", undefined);
        expect(performTestCommand(makeFinder(element), {
            command: "scroll-to-end",
            dataId: "target",
        })).toEqual({
            ok: true,
        });
        expect(element.scrollTop).toBe(500);
    });

    test("in-view succeeds when the element is inside the window and fails when it is not", () => {
        expect(performTestCommand(makeFinder(makePlacedElement("", undefined, {
            left: 400,
            right: 1000,
            top: 0,
            bottom: 20,
        })), {
            command: "in-view",
            dataId: "target",
        })).toEqual({
            ok: true,
        });
        expect(performTestCommand(makeFinder(makePlacedElement("", undefined, {
            left: 700,
            right: 1300,
            top: 0,
            bottom: 20,
        })), {
            command: "in-view",
            dataId: "target",
        })).toEqual({
            ok: false,
            error: "The element with the data-id target is outside the window: its left edge is at 700, its right edge is at 1300 and the window is 1000 wide.",
        });
    });

    test("in-view-of succeeds when the element is inside the container and fails when it is not", () => {
        expect(performTestCommand(makeListFinder(placedRow(150, 180)), {
            command: "in-view-of",
            dataId: "target",
            containerDataId: "list",
        })).toEqual({
            ok: true,
        });
        expect(performTestCommand(makeListFinder(placedRow(390, 420)), {
            command: "in-view-of",
            dataId: "target",
            containerDataId: "list",
        })).toEqual({
            ok: false,
            error: "The element with the data-id target is outside list: its top edge is at 390 and its bottom edge at 420, and list runs from 100 to 400.",
        });
    });

    test("in-view-of fails with no container data-id or no container with it", () => {
        expect(performTestCommand(makeListFinder(placedRow(150, 180)), {
            command: "in-view-of",
            dataId: "target",
        })).toEqual({
            ok: false,
            error: "The in-view-of command needs a containerDataId.",
        });
        expect(performTestCommand(makeListFinder(placedRow(150, 180)), {
            command: "in-view-of",
            dataId: "target",
            containerDataId: "missing",
        })).toEqual({
            ok: false,
            error: "No element has the data-id missing.",
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

describe("elementInsideResult", () => {
    test("succeeds when both edges are inside the container, including on its edges", () => {
        expect(elementInsideResult({
            left: 0,
            right: 100,
            top: 100,
            bottom: 400,
        }, {
            left: 0,
            right: 100,
            top: 100,
            bottom: 400,
        }, "row", "list")).toEqual({
            ok: true,
        });
    });

    test("rounds the edges to whole pixels", () => {
        expect(elementInsideResult({
            left: 0,
            right: 100,
            top: 99.6,
            bottom: 400.4,
        }, {
            left: 0,
            right: 100,
            top: 100,
            bottom: 400,
        }, "row", "list")).toEqual({
            ok: true,
        });
    });

    test("fails when the element starts above the container", () => {
        expect(elementInsideResult({
            left: 0,
            right: 100,
            top: 90,
            bottom: 120,
        }, {
            left: 0,
            right: 100,
            top: 100,
            bottom: 400,
        }, "row", "list")).toEqual({
            ok: false,
            error: "The element with the data-id row is outside list: its top edge is at 90 and its bottom edge at 120, and list runs from 100 to 400.",
        });
    });

    test("fails when the element ends below the container", () => {
        expect(elementInsideResult({
            left: 0,
            right: 100,
            top: 380,
            bottom: 401,
        }, {
            left: 0,
            right: 100,
            top: 100,
            bottom: 400,
        }, "row", "list")).toEqual({
            ok: false,
            error: "The element with the data-id row is outside list: its top edge is at 380 and its bottom edge at 401, and list runs from 100 to 400.",
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
