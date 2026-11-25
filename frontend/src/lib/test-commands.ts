import type { IAddTask, IJsonObject, IJsonValue, ITaskCompletedEvent } from "ziggy";

//
// The commands the remote control connection forwards to the frontend, performed on the frontend's DOM by data-id. The frontend
// replies to each with a result. These exist only so the smoke tests can drive the real app, and the backend sends them only in
// the app was started with --remote-control.
//

//
// A command from the remote control connection.
//
export interface ITestCommand {
    // What to do: ready, click, type, key-down, get-value, get-text, exists, in-view, in-view-of,
    // scroll-to-end, insert, viewport, drop-file or run-task.
    command: string;

    // The data-id of the element to act on.
    dataId?: string;

    // The data-id of the scrolling element the element must show inside, for the in-view-of
    // command.
    containerDataId?: string;

    // The text to type, for the type command.
    text?: string;

    // The character of the key to press, for the key-down command, such as "?".
    key?: string;

    // Whether Control is held, for the key-down command.
    ctrl?: boolean;

    // The name of the file to drop, for the drop-file command.
    fileName?: string;

    // The size in bytes of the file to drop, for the drop-file command.
    fileSize?: number;

    // The type of the backend task to queue, for the run-task command.
    taskType?: string;

    // The data to queue the backend task with, for the run-task command.
    taskData?: IJsonValue;
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
// Where an element's edges are, in pixels from the window's left and top edges, which the in-view
// command reads across and the in-view-of command reads down.
//
export interface IBounds extends IHorizontalBounds {
    // The distance of the element's top edge from the window's top edge.
    top: number;

    // The distance of the element's bottom edge from the window's top edge.
    bottom: number;
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
    getBoundingClientRect(): IBounds;

    // How far the element's content is scrolled from its top, in pixels, which the scroll-to-end
    // command sets.
    scrollTop: number;

    // The height of the element's content in pixels, scrolled or not, which the scroll-to-end
    // command scrolls to.
    scrollHeight: number;
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
        clickElement(element);
        return { ok: true };
    }
    if (command.command === "type") {
        if (command.text === undefined) {
            return { ok: false, error: "The type command needs text." };
        }
        setElementValue(element, command.text);
        element.dispatchEvent(new Event("input", { bubbles: true }));
        return { ok: true };
    }
    if (command.command === "key-down") {
        return keyDownResult(element, command);
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
    if (command.command === "scroll-to-end") {
        element.scrollTop = element.scrollHeight;
        return {
            ok: true,
        };
    }
    if (command.command === "in-view-of") {
        return inViewOfResult(finder, element, command.dataId, command.containerDataId);
    }
    return { ok: false, error: `Unknown test command ${command.command}.` };
}

//
// Clicks the element for the click command as a user's click reaches the page: a mousedown and a
// mouseup of the main button, then the click. Some components act only on a click whose mousedown
// they saw on the same element, such as MaterialUI's Dialog, which closes on a click outside it
// only then, so a click alone would leave it open.
//
export function clickElement(element: IFoundElement): void {
    element.dispatchEvent(new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        button: 0,
    }));
    element.dispatchEvent(new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        button: 0,
    }));
    element.click();
}

//
// Sets the element's value for the type command so React sees the change and calls the control's
// onChange, as when a user types. React watches a control's value through a setter it puts on the
// element itself, and a value set through that setter looks to React like its own, so the input
// event that follows changes nothing. The setter of the element's prototype, the browser's own,
// sets the value past React's. An element with no such setter has its value set directly.
//
export function setElementValue(element: IFoundElement, text: string): void {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value")?.set;
    if (setter) {
        setter.call(element, text);
    }
    else {
        element.value = text;
    }
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

//
// Performs the in-view-of command: finds the container by its data-id and checks the element's
// top and bottom edges are inside the container's, so a smoke test can check a row is in the
// visible part of the list that scrolls it. A missing container data-id or container is a failure
// with a reason.
//
export function inViewOfResult(finder: IElementFinder, element: IFoundElement, dataId: string, containerDataId: string | undefined): ITestResult {
    if (containerDataId === undefined) {
        return {
            ok: false,
            error: "The in-view-of command needs a containerDataId.",
        };
    }
    const container = finder.find(containerDataId);
    if (container === null) {
        return {
            ok: false,
            error: `No element has the data-id ${containerDataId}.`,
        };
    }
    return elementInsideResult(element.getBoundingClientRect(), container.getBoundingClientRect(), dataId, containerDataId);
}

//
// Works out the result of the in-view-of command from where the element and its container are:
// success when the element's top and bottom edges are both inside the container's, and otherwise
// a failure with where the edges are. Rounding to whole pixels allows for the fractions a scroll
// can leave.
//
export function elementInsideResult(bounds: IBounds, containerBounds: IBounds, dataId: string, containerDataId: string): ITestResult {
    const top = Math.round(bounds.top);
    const bottom = Math.round(bounds.bottom);
    const containerTop = Math.round(containerBounds.top);
    const containerBottom = Math.round(containerBounds.bottom);
    if (containerTop <= top) {
        if (bottom <= containerBottom) {
            return {
                ok: true,
            };
        }
    }
    return {
        ok: false,
        error: `The element with the data-id ${dataId} is outside ${containerDataId}: its top edge is at ${top} and its bottom edge at ${bottom}, and ${containerDataId} runs from ${containerTop} to ${containerBottom}.`,
    };
}

//
// Performs the key-down command: dispatches a keydown event for the key, with Control held when
// the command's ctrl field is true, on the element, from where it bubbles up to the window as a
// real key press does. The native app's press-key takes only Ziggy's shortcut syntax, which refuses
// `/` as a key, so the smoke tests press Ctrl+/ this way. The value is "prevented" when a
// listener kept the key from doing anything else, as Graft does with a key it handles, and
// "not prevented" when the key went on to its default.
//
export function keyDownResult(element: IFoundElement, command: ITestCommand): ITestResult {
    if (!command.key) {
        return {
            ok: false,
            error: "The key-down command needs a key.",
        };
    }
    const event = new KeyboardEvent("keydown", {
        key: command.key,
        ctrlKey: command.ctrl === true,
        bubbles: true,
        cancelable: true,
    });
    if (element.dispatchEvent(event)) {
        return {
            ok: true,
            value: "not prevented",
        };
    }
    return {
        ok: true,
        value: "prevented",
    };
}

//
// Performs the run-task command: queues the backend task the command names with the command's
// data, exactly as the frontend would, and calls onResult with the task's result as JSON text once
// it ends, so a smoke test can send the backend invalid data and check how the backend
// handles it. A command with no task type is a failure with a reason.
//
export function runTaskCommand(taskId: string, command: ITestCommand, onResult: (result: ITestResult) => void): void {
    if (!command.taskType) {
        onResult({
            ok: false,
            error: "The run-task command needs a taskType.",
        });
        return;
    }

    function onTaskCompleted(event: ITaskCompletedEvent): void {
        if (event.taskId !== taskId) {
            return;
        }
        window.ziggy.removeTaskCompletedListener(onTaskCompleted);
        onResult({
            ok: true,
            value: JSON.stringify(event.result),
        });
    }

    window.ziggy.onTaskCompleted(onTaskCompleted);
    const task: IAddTask = {
        taskId,
        taskType: command.taskType,
        source: "test-commands",
        data: command.taskData ?? null,
        priority: "interactive",
    };
    window.ziggy.addTask(task);
}
