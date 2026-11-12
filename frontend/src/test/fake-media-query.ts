//
// A fake of the media query that matches while the system's theme is dark, because jsdom has no
// window.matchMedia. A test changes the system's theme with setMatches, which tells every listener
// the way a browser does.
//

//
// A media query list a test controls.
//
export interface IFakeMediaQuery extends MediaQueryList {
    // Changes whether the query matches and tells each change listener.
    setMatches(matches: boolean): void;

    // How many change listeners are listening.
    listenerCount(): number;
}

//
// Makes a fake media query for the query text that matches as given.
//
export function makeFakeMediaQuery(query: string, matches: boolean): IFakeMediaQuery {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const fake = {
        matches,
        media: query,
        onchange: null,
        addEventListener(type: string, listener: (event: MediaQueryListEvent) => void): void {
            expect(type).toBe("change");
            listeners.add(listener);
        },
        removeEventListener(type: string, listener: (event: MediaQueryListEvent) => void): void {
            expect(type).toBe("change");
            listeners.delete(listener);
        },
        setMatches(newMatches: boolean): void {
            fake.matches = newMatches;
            for (const listener of listeners) {
                listener({ matches: newMatches, media: query } as MediaQueryListEvent);
            }
        },
        listenerCount(): number {
            return listeners.size;
        },
    };
    return fake as unknown as IFakeMediaQuery;
}
