//
// Tests the date formats of the repo explorer page: formats fixed dates in fixed locales and time
// zones and checks the text, so the tests give the same result on every machine.
//

import { formatDate, formatDateTime } from "../../lib/date-format";

//
// A commit date late in the day in UTC, which is already the next day east of it.
//
const lateDate = new Date("2026-01-03T23:30:05Z");

//
// Turns every kind of space in the text into a plain space. Node's ICU puts a narrow no-break
// space before AM and PM where Bun's puts a plain one, so the tests compare times with this to get
// the same result whichever runs them.
//
function plainSpaces(text: string | null | undefined): string {
    return (text ?? "").replace(/\s/g, " ");
}

describe("formatDate", () => {
    test("formats the day as its day and short month name in the locale", () => {
        expect(formatDate(lateDate, {
            locale: "en-US",
            timeZone: "UTC",
        })).toBe("Jan 3");
        expect(formatDate(lateDate, {
            locale: "en-GB",
            timeZone: "UTC",
        })).toBe("3 Jan");
    });

    test("formats the day in the time zone", () => {
        expect(formatDate(lateDate, {
            locale: "en-US",
            timeZone: "Australia/Brisbane",
        })).toBe("Jan 4");
    });
});

describe("formatDateTime", () => {
    test("formats the date with its time to the minute in the locale and time zone", () => {
        expect(plainSpaces(formatDateTime(lateDate, {
            locale: "en-US",
            timeZone: "UTC",
        }))).toBe("Jan 3, 2026, 11:30 PM");
        expect(plainSpaces(formatDateTime(lateDate, {
            locale: "en-US",
            timeZone: "Australia/Brisbane",
        }))).toBe("Jan 4, 2026, 9:30 AM");
    });
});
