# package-linux.sh

Builds the template for release and packages it as `out/linux/graft-<version>-linux-<arch>.zip` and `.deb`. The version comes from `apps/graft/package.json`. The packages are unsigned. Runs on Linux and needs `zip`, `dpkg-deb` and `jq`.

The frontend is embedded in the executable, so the app is one file. The zip holds one directory with that executable. The deb installs it as `/opt/graft/graft`, links it into `/usr/bin` and adds a menu entry (`/usr/share/applications/au.com.codecapers.graft.desktop`) with the icon `assets/graft-512.png`, installed as `/usr/share/icons/hicolor/512x512/apps/au.com.codecapers.graft.png`, so the app shows with its icon in the applications menu, search and the dock. It depends on the GTK 3 and WebKitGTK 4.1 runtime libraries (`libgtk-3-0` and `libwebkit2gtk-4.1-0`) and on the plugins of GStreamer (`gstreamer1.0-plugins-good` and `gstreamer1.0-libav`).

- `--output-dir <dir>`: where the zip and the deb go, in place of `out/linux`. The smoke tests give each run a directory of its own, so two runs in one checkout never write the same file.
