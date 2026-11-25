//
// Puts a test's fake on window.ziggy, where Graft's frontend reaches the backend, so the code under
// test calls the fake.
//

import type { IZiggyBridge } from "ziggy";

//
// The calls of window.ziggy that queue a task and report its end, which a fake makes of Jest mocks,
// with the state file calls the repo explorer page reads and saves its panes' widths with.
//
export type FakeTaskZiggy = Pick<IZiggyBridge, "addTask" | "onTaskCompleted" | "removeTaskCompletedListener" | "getState" | "setState">;

//
// Makes the fake window.ziggy and returns it.
//
export function installFakeZiggy<TFake extends Partial<IZiggyBridge>>(fake: TFake): TFake {
    Object.defineProperty(window, "ziggy", {
        value: fake,
        configurable: true,
        writable: true,
    });
    return fake;
}

//
// Makes a fake window.ziggy whose task calls are Jest mocks, and returns it. Its state file holds
// nothing and takes every write.
//
export function installFakeTaskZiggy(): FakeTaskZiggy {
    return installFakeZiggy({
        addTask: jest.fn(),
        onTaskCompleted: jest.fn(),
        removeTaskCompletedListener: jest.fn(),
        getState: jest.fn().mockResolvedValue(undefined),
        setState: jest.fn().mockResolvedValue(undefined),
    });
}
