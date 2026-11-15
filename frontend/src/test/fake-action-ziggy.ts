//
// A fake of the calls of window.ziggy that register and remove an action's handler, which a test
// puts on window.ziggy. It keeps each registered handler, so a test runs an action the way Ziggy
// does when the user presses the action's shortcut, and it fails a test that registers a name
// twice, as Ziggy throws for one.
//

import type { IActionHandler, IZiggyBridge } from "ziggy";

//
// The action calls of window.ziggy, which the fake makes, and the way a test runs an action.
//
export interface IFakeActionZiggy extends Pick<IZiggyBridge, "registerAction" | "removeAction"> {
    // Runs the handler registered for the action, as Ziggy does for the action's shortcut, and
    // resolves once the handler has finished.
    runRegisteredAction(name: string): Promise<void>;

    // Returns true when a handler is registered for the action, so a test checks the overlay
    // registered its handler and removed it.
    hasRegisteredAction(name: string): boolean;
}

//
// Makes the fake and returns it, so a test can add it to another fake before it puts the result on
// window.ziggy.
//
export function makeFakeActionZiggy(): IFakeActionZiggy {
    const handlers = new Map<string, IActionHandler>();
    return {
        registerAction(name: string, handler: IActionHandler): void {
            expect(handlers.has(name)).toBe(false);
            handlers.set(name, handler);
        },
        removeAction(name: string): void {
            expect(handlers.has(name)).toBe(true);
            handlers.delete(name);
        },
        async runRegisteredAction(name: string): Promise<void> {
            const handler = handlers.get(name);
            expect(handler).not.toBeUndefined();
            await handler?.();
        },
        hasRegisteredAction(name: string): boolean {
            return handlers.has(name);
        },
    };
}
