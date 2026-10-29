//
// Starts Graft's frontend: shows its pages through the router and answers the commands the
// smoke tests send.
//

import { StyledEngineProvider } from "@mui/material/styles";
import { AnyRouter, createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { IZiggyBridge } from "ziggy";
import { ITestCommand, performTestCommand, testResultToJson } from "./lib/test-commands";
import { AboutPage } from "./pages/about";

//
// What listenForTestCommands needs of window.ziggy, so a test can give it a fake with only these.
//
export type TestCommandBridge = Pick<IZiggyBridge, "onTestCommand" | "sendTestResult" | "testUiReady">;

//
// Makes the router that picks the page to show. The app opens on the About page. The history is
// kept in memory, because the web view loads the frontend from the app's own address, whose path
// is the file index.html and not a page of Graft's.
//
export function createAppRouter(): AnyRouter {
    const rootRoute = createRootRoute();
    const aboutRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        component: AboutPage,
    });
    return createRouter({
        routeTree: rootRoute.addChildren([aboutRoute]),
        history: createMemoryHistory({
            initialEntries: ["/"],
        }),
    });
}

//
// Shows the app's pages in the element. MaterialUI's styles go in a CSS layer of their own, so
// Tailwind's classes can style MaterialUI components (see main.css).
//
export function startApp(rootElement: HTMLElement): void {
    createRoot(rootElement).render(
        <StrictMode>
            <StyledEngineProvider enableCssLayer={true}>
                <RouterProvider router={createAppRouter()} />
            </StyledEngineProvider>
        </StrictMode>
    );
}

//
// Handles the commands the test control connection forwards, which the smoke tests send. It acts
// only when the native app started the frontend in test mode, which it does only in a build with
// the test hooks, and it tells the backend when it is listening so that every command is sent
// after it can be heard.
//
export function listenForTestCommands(ziggy: TestCommandBridge, search: string, page: Document): void {
    if (new URLSearchParams(search).get("testMode") === "1") {
        ziggy.onTestCommand<ITestCommand>(event => {
            const finder = {
                find: (dataId: string) => page.querySelector<HTMLElement>(`[data-id="${dataId}"]`),
            };
            ziggy.sendTestResult(event.requestId, testResultToJson(performTestCommand(finder, event.command)))
                .catch(error => {
                    console.error(`Graft could not send the smoke tests the result of the ${event.command.command} command: ${String(error)}. The smoke test that sent it gets no answer and fails, so look for why the test control connection failed.`);
                });
        });
        ziggy.testUiReady();
    }
}

//
// The element the app is drawn in. It is made here rather than found in index.html, so the app
// can never start without one.
//
const appElement = document.createElement("div");
document.body.appendChild(appElement);
startApp(appElement);
listenForTestCommands(window.ziggy, window.location.search, document);
