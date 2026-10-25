// Ziggy's package, which the Zig build fetches into zig-pkg and Gradle checks out under native/android/.gradle, holds tests of its
// own. They are Ziggy's to run, not this app's.
const ziggyCopies = [
    "<rootDir>/zig-pkg/",
    "<rootDir>/native/android/.gradle/",
];

export default {
    preset: 'ts-jest',
    modulePathIgnorePatterns: [
        "<rootDir>/dist/",
        "<rootDir>/build/",
        ...ziggyCopies,
    ],
    testPathIgnorePatterns: [
        "/node_modules/",
        ...ziggyCopies,
    ],
};
