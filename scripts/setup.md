# setup.sh

Runs the setup script that applies to this machine: Windows under Git Bash. Linux and macOS need nothing more than `mise install`. The Windows script fetches the pinned WebView2 SDK and WiX Toolset, and installs Microsoft's C++ toolchain and the Windows SDK when they are missing. No arguments. The root `bun run setup` reaches it through this package's `setup` script.

## See also

- [setup-windows.sh](setup-windows.md): what the Windows setup installs and why.
