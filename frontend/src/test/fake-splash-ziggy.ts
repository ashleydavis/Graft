//
// A fake of the calls of window.ziggy the splash screen makes as main.tsx loads, which a test adds
// to the window.ziggy it installs: the event listener that receives the event of the frontend
// coming into sight, the call that marks the frontend as ready and the one that marks the splash as
// fading. Each is a Jest mock, so a test checks the calls main.tsx made.
//

//
// The splash screen's calls of window.ziggy, each a Jest mock.
//
export interface IFakeSplashZiggy {
    // Adds the listener that receives the native app's events, such as the frontend coming into
    // sight.
    onEvent: jest.Mock;

    // Marks the frontend as ready to the native app, so it shows the page.
    frontendReady: jest.Mock;

    // Marks the splash as fading to the native app, so it fades the splash colour over its menu
    // bar.
    splashFading: jest.Mock;
}

//
// Makes the fake, so a test can add it to another fake before it puts the result on window.ziggy.
//
export function makeFakeSplashZiggy(): IFakeSplashZiggy {
    return {
        onEvent: jest.fn(),
        frontendReady: jest.fn(),
        splashFading: jest.fn(),
    };
}
