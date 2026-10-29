//
// Tests the commands the smoke tests send through the test control connection: each command is
// performed on a fake element finder, and each result is checked, including every failure and how
// a result is turned into JSON.
//

import { IElementFinder, IFoundElement, performTestCommand, testResultToJson } from "../../lib/test-commands";

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
// Makes a fake element with the text and value.
//
function makeElement(text: string | null, value: string | undefined): IFakeElement {
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
