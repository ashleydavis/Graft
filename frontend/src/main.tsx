//
// Starts Graft's frontend: shows its pages through the router and answers the commands the
// smoke tests send.
//

import { StyledEngineProvider } from "@mui/material/styles";
import { AnyRouter, createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppLayout } from "./components/app-layout";
import { AppTheme, systemDarkQuery } from "./components/app-theme";
import { RepoProvider } from "./components/repo-context";
import { repoPathFromSearch } from "./lib/commits";
import { IDocumentLike, installSplashScreen } from "./lib/splash";
import { ITestCommand, performTestCommand, testResultToJson } from "./lib/test-commands";
import { AboutPage } from "./pages/about";
import { CommitsPage } from "./pages/commits";
import { HelpPage } from "./pages/help";
import { WelcomePage } from "./pages/welcome";

//
// The colour behind the splash art, the same as .splash's background in app.zon.
//
const splashBackground = "#FFFFFF";

//
// Makes the router that picks the page to show. Every page shows in the main content area of the
// app's layout. The app opens on the welcome page, which is shown while no repo is open and opens
// one. The About page, the commits page and the Help page sit beside it. The history is kept in
// memory, because the web view loads the frontend from the app's own address, whose path is the
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
    const commitsRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/commits",
        component: CommitsPage,
    });
    const helpRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/help",
        component: HelpPage,
    });
    return createRouter({
        routeTree: rootRoute.addChildren([welcomeRoute, aboutRoute, commitsRoute, helpRoute]),
        history: createMemoryHistory({
            initialEntries: ["/"],
        }),
    });
}

//
// Shows the app's pages in the element, in the theme the user picks. MaterialUI's styles go in a
// CSS layer of their own, so Tailwind's classes can style MaterialUI components (see main.css). The
// open repo is kept above the router, so it stays loaded while the user moves between pages. Graft
// starts with no repo open, or in a smoke test on the test repo the query of the frontend's
// address names.
//
export function startApp(rootElement: HTMLElement): void {
    createRoot(rootElement).render(
        <StrictMode>
            <StyledEngineProvider enableCssLayer={true}>
                <AppTheme systemDark={window.matchMedia(systemDarkQuery)}>
                    <RepoProvider initialRepoPath={repoPathFromSearch(window.location.search)}>
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
        minimumDisplayMilliseconds: 500,
        fadeDurationMilliseconds: 500,
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
            const finder = {
                find: (dataId: string) => page.querySelector<HTMLElement>(`[data-id="${dataId}"]`),
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
            };
            window.ziggy.sendTestResult(event.requestId, testResultToJson(performTestCommand(finder, event.command)))
                .catch(error => {
                    console.error(`Graft could not send the smoke tests the result of the ${event.command.command} command: ${String(error)}. The smoke test that sent it gets no answer and fails, so look for why the remote control connection failed.`);
                });
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
