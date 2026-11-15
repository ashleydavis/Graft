import type { IJsonObject } from "ziggy";

//
// The commands the remote control connection forwards to the frontend, performed on the frontend's DOM by data-id. The frontend
// replies to each with a result. These exist only so the smoke tests can drive the real app, and the backend sends them only in
// the app was started with --remote-control.
//

//
// A command from the remote control connection.
//
export interface ITestCommand {
    // What to do: ready, click, type, get-value, get-text, exists, in-view, insert, viewport or
    // drop-file.
    command: string;

    // The data-id of the element to act on.
    dataId?: string;

    // The text to type, for the type command.
    text?: string;

    // The name of the file to drop, for the drop-file command.
    fileName?: string;

    // The size in bytes of the file to drop, for the drop-file command.
    fileSize?: number;
}

//
// What the frontend replies to a command with.
//
export interface ITestResult {
    // Whether the command succeeded.
    ok: boolean;

    // The value or text read, for the get commands.
    value?: string;

    // Why the command failed, when it did.
    error?: string;
}

//
// What a command needs to find and act on elements. The frontend gives the real document and a test gives a fake.
//
export interface IElementFinder {
    // Finds the element with the data-id, or null.
    find(dataId: string): IFoundElement | null;

    // The width in pixels of the window the page is drawn in, which the in-view command checks an
    // element's edges against.
    windowWidth: number;

    // The height in pixels of the window the page is drawn in, which the viewport command reports
    // with the width.
    windowHeight: number;
}

//
// Where an element's left and right edges are, in pixels from the left edge of the window, which
// the in-view command reads to check the element is inside the window.
//
export interface IHorizontalBounds {
    // The distance of the element's left edge from the window's left edge.
    left: number;

    // The distance of the element's right edge from the window's left edge.
    right: number;
}

//
// An element a command can act on.
//
export interface IFoundElement {
    // The element's text.
    textContent: string | null;

    // The element's value, when it is a control with one.
    value?: string;

    // Clicks the element.
    click(): void;

    // Gives the element the keyboard focus.
    focus(): void;

    // Dispatches an event on the element.
    dispatchEvent(event: Event): boolean;

    // Reads where the element's edges are in the window.
    getBoundingClientRect(): IHorizontalBounds;
}

//
// Performs one test command and returns its result. An unknown command or a missing element is a failure with a reason,
// never a silent success.
//
export function performTestCommand(finder: IElementFinder, command: ITestCommand): ITestResult {
    if (command.command === "ready") {
        return { ok: true };
    }
    if (command.command === "viewport") {
        return {
            ok: true,
            value: `${finder.windowWidth}x${finder.windowHeight}`,
        };
    }
    if (command.dataId === undefined) {
        return { ok: false, error: `The ${command.command} command needs a dataId.` };
    }
    const element = finder.find(command.dataId);
    if (command.command === "exists") {
        return { ok: element !== null };
    }
    if (element === null) {
        return { ok: false, error: `No element has the data-id ${command.dataId}.` };
    }
    if (command.command === "click") {
        element.click();
        return { ok: true };
    }
    if (command.command === "type") {
        if (command.text === undefined) {
            return { ok: false, error: "The type command needs text." };
        }
        element.value = command.text;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        return { ok: true };
    }
    if (command.command === "get-value") {
        return { ok: true, value: element.value ?? "" };
    }
    if (command.command === "get-text") {
        return { ok: true, value: element.textContent ?? "" };
    }
    if (command.command === "in-view") {
        return elementInViewResult(element.getBoundingClientRect(), finder.windowWidth, command.dataId);
    }
    return { ok: false, error: `Unknown test command ${command.command}.` };
}

//
// Converts a result to the JSON the frontend sends back with window.ziggy.sendTestResult. A field with no value is left out.
//
export function testResultToJson(result: ITestResult): IJsonObject {
    const json: IJsonObject = { ok: result.ok };
    if (result.value !== undefined) {
        json.value = result.value;
    }
    if (result.error !== undefined) {
        json.error = result.error;
    }
    return json;
}

//
// Works out the result of the in-view command: success when the element's left and right edges
// are both inside the window's width, so a smoke test can check the user can see a pane, and
// otherwise a failure with where the edges are. Rounding to whole pixels allows for the fractions
// a scroll can leave.
//
export function elementInViewResult(bounds: IHorizontalBounds, windowWidth: number, dataId: string): ITestResult {
    const left = Math.round(bounds.left);
    const right = Math.round(bounds.right);
    if (0 <= left) {
        if (right <= windowWidth) {
            return {
                ok: true,
            };
        }
    }
    return {
        ok: false,
        error: `The element with the data-id ${dataId} is outside the window: its left edge is at ${left}, its right edge is at ${right} and the window is ${windowWidth} wide.`,
    };
}
