//
// Starts Graft's frontend: shows its pages through the router and answers the commands the
// smoke tests send.
//

import { StyledEngineProvider } from "@mui/material/styles";
import GlobalStyles from "@mui/material/GlobalStyles";
import { AnyRouter, createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppLayout } from "./components/app-layout";
import { AppTheme, systemDarkQuery } from "./components/app-theme";
import { RepoProvider } from "./components/repo-context";
import { IDocumentLike, installSplashScreen } from "./lib/splash";
import { ITestCommand, ITestResult, performTestCommand, runTaskCommand, testResultToJson } from "./lib/test-commands";
import { AboutPage } from "./pages/about";
import { RepoExplorerPage } from "./pages/repo-explorer";
import { HelpPage } from "./pages/help";
import { WelcomePage } from "./pages/welcome";

//
// The colour behind the splash art, the same as .splash's background in app.zon.
//
const splashBackground = "#14171A";

//
// Makes the router that picks the page to show. Every page shows in the main content area of the
// app's layout. The app opens on the welcome page, which is shown while no repo is open and opens
// one. The About page, the repo explorer page and the Help page sit beside it. The history is kept
// in memory, because the web view loads the frontend from the app's own address, whose path is the
// file index.html and not a page of Graft's. The layout and the pages read the open repo from
// RepoProvider, which startApp puts around the router.
//
export function createAppRouter(): AnyRouter {
    const rootRoute = createRootRoute({
        component: AppLayout,
    });
    const welcomeRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        component: WelcomePage,
    });
    const aboutRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/about",
        component: AboutPage,
    });
    const repoExplorerRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/repo-explorer",
        component: RepoExplorerPage,
    });
    const helpRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/help",
        component: HelpPage,
    });
    return createRouter({
        routeTree: rootRoute.addChildren([
            welcomeRoute,
            aboutRoute,
            repoExplorerRoute,
            helpRoute,
        ]),
        history: createMemoryHistory({
            initialEntries: ["/"],
        }),
    });
}

//
// Shows the app's pages in the element, in the theme the user picks. MaterialUI's styles go in a
// CSS layer of their own, so Tailwind's classes can style MaterialUI components (see main.css). The
// open repo is kept above the router, so it stays loaded while the user moves between pages. Graft
// starts with no repo open, and the user opens one from the welcome page or the File menu.
//
export function startApp(rootElement: HTMLElement): void {
    createRoot(rootElement).render(
        <StrictMode>
            <StyledEngineProvider enableCssLayer={true}>
                {/*
                  MaterialUI inserts its styles at the top of the page head, ahead of main.css,
                  and the first declaration of the layer order wins, so the order is declared here
                  as well. It puts Tailwind's base styles under MaterialUI's, so Tailwind's reset
                  of borders and padding does not undo a text box's outline and padding.
                */}
                <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
                <AppTheme systemDark={window.matchMedia(systemDarkQuery)}>
                    <RepoProvider>
                        <RouterProvider router={createAppRouter()} />
                    </RepoProvider>
                </AppTheme>
            </StyledEngineProvider>
        </StrictMode>
    );
}

//
// Covers the page with Graft's splash screen, the same art the native app shows while the frontend
// loads, and tells the native app the frontend is ready, so it shows the page. When the native app
// says the page is in sight, the splash fades out.
//
export function showSplashScreen(page: IDocumentLike | Document): void {
    const splash = installSplashScreen(page, {
        background: splashBackground,
        minimumDisplayMilliseconds: 1000,
        fadeDurationMilliseconds: 1000,
        // The native app fades the splash colour over its menu bar with the overlay.
        onFadeStart: durationMilliseconds => window.ziggy.splashFading(durationMilliseconds),
    });
    window.ziggy.onEvent((event: { type?: string } | null) => {
        if (event !== null && event.type === "frontend-visible") {
            // remove never rejects: it resolves once the overlay has faded out and gone.
            void splash.remove();
        }
    });
    window.ziggy.frontendReady();
}

//
// Handles the commands the remote control connection forwards, which the smoke tests send. It acts
// only when the native app started the frontend in test mode, which it does only when the app was
// started with --remote-control, and it tells the backend when it is listening so that every command is sent
// after it can be heard.
//
export function listenForTestCommands(search: string, page: Document): void {
    if (new URLSearchParams(search).get("testMode") === "1") {
        window.ziggy.onTestCommand<ITestCommand>(event => {
            function sendResult(result: ITestResult): void {
                window.ziggy.sendTestResult(event.requestId, testResultToJson(result))
                    .catch(error => {
                        console.error(`Graft could not send the smoke tests the result of the ${event.command.command} command: ${String(error)}. The smoke test that sent it gets no answer and fails, so look for why the remote control connection failed.`);
                    });
            }

            if (event.command.command === "run-task") {
                // The task ends after this callback returns, so its result is sent when it ends.
                runTaskCommand(`run-task-${event.requestId}`, event.command, sendResult);
                return;
            }
            const finder = {
                find: (dataId: string) => page.querySelector<HTMLElement>(`[data-id="${dataId}"]`),
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
            };
            sendResult(performTestCommand(finder, event.command));
        });
        window.ziggy.testUiReady();
    }
}

//
// The element the app is drawn in. It is made here rather than found in index.html, so the app
// can never start without one.
//
const appElement = document.createElement("div");
document.body.appendChild(appElement);
startApp(appElement);
showSplashScreen(document);
listenForTestCommands(window.location.search, document);
