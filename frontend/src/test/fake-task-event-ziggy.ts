//
// A fake of the calls of window.ziggy that add and remove a task event listener, which the layout
// makes to receive the Git commands every page runs. A test adds it to the window.ziggy it installs.
// Each is a Jest mock, so a test reads the listeners the layout added.
//

//
// The task event listener calls of window.ziggy, each a Jest mock.
//
export interface IFakeTaskEventZiggy {
    // Adds a listener for every task's events.
    onTaskEvent: jest.Mock;

    // Removes a listener onTaskEvent added.
    removeTaskEventListener: jest.Mock;
}

//
// Makes the fake, so a test can add it to another fake before it puts the result on window.ziggy.
//
export function makeFakeTaskEventZiggy(): IFakeTaskEventZiggy {
    return {
        onTaskEvent: jest.fn(),
        removeTaskEventListener: jest.fn(),
    };
}
