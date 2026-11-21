//
// Tests opening a page through the router: openPage calls the navigate it is given with the page's
// path and reports a page the router could not open, and navigationFailureReporter reports which
// page could not be opened and why.
//

import { navigationFailureReporter, openPage } from "../../lib/navigation";

describe("openPage", () => {
    test("calls the router's navigate with the page's path", () => {
        const navigate = jest.fn().mockResolvedValue(undefined);
        openPage(navigate, "/repo-explorer");
        expect(navigate).toHaveBeenCalledWith({
            to: "/repo-explorer",
        });
    });

    test("reports a page the router could not open", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        const navigate = jest.fn().mockRejectedValue(new Error("the route is missing"));
        openPage(navigate, "/help");
        await Promise.resolve();
        await Promise.resolve();
        expect(consoleError).toHaveBeenCalledWith("Graft could not open the page at /help: Error: the route is missing. The page stays as it was, so look at the router's routes for that path.");
        consoleError.mockRestore();
    });
});

describe("navigationFailureReporter", () => {
    test("reports which page could not be opened and why", () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        navigationFailureReporter("/help")(new Error("the route is missing"));
        expect(consoleError).toHaveBeenCalledWith("Graft could not open the page at /help: Error: the route is missing. The page stays as it was, so look at the router's routes for that path.");
        consoleError.mockRestore();
    });
});
