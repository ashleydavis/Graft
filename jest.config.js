// Ziggy's package, which the Zig build fetches into zig-pkg, holds tests of its
// own. They are Ziggy's to run, not this app's.
const ziggyCopies = [
    "<rootDir>/zig-pkg/",
];

// Git worktrees made inside the checkout hold other branches' copies of the code. Their tests
// belong to those branches, so a run here leaves them out.
const worktreeCopies = [
    "<rootDir>/worktrees/",
    "<rootDir>/.claude/worktrees/",
];

export default {
    preset: 'ts-jest',

    //
    // The frontend's pages are rendered into a browser's document in the tests.
    //
    testEnvironment: 'jsdom',

    //
    // Every frontend source file must be unit tested to 100%, including any file no test loads,
    // so a run fails when one is not.
    //
    collectCoverage: true,
    collectCoverageFrom: [
        "frontend/src/**/*.{ts,tsx}",
        "!frontend/src/test/**",
    ],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
    modulePathIgnorePatterns: [
        "<rootDir>/dist/",
        "<rootDir>/build/",
        ...ziggyCopies,
        ...worktreeCopies,
    ],
    testPathIgnorePatterns: [
        "/node_modules/",
        ...ziggyCopies,
        ...worktreeCopies,
    ],
};
