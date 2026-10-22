# Zig

- Background tasks and any other Zig threads do not share state or use locks. Threads communicate through messages, which can be JSON or binary depending on the needs. Adding a lock to the code is a sign that this rule is being broken.
- Standard services such as IO and the allocator, and custom services defined within the app, are passed to functions as parameters and are not stored in structs.
- Avoid global variables where possible. Where one is needed, it is used only at the outer edges of the program, such as `main` and the entry points, never deep in the code.
