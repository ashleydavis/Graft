import { watch } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, Plugin } from 'vite';

//
// A frontend loaded from a file address cannot load module scripts in every web view, so the built frontend uses
// an ordinary deferred script instead of a module script.
//
function classicScript(): Plugin {
    return {
        name: 'classic-script',
        enforce: 'post',
        transformIndexHtml(html: string): string {
            return html.replace(/<script type="module" crossorigin/g, '<script defer');
        },
    };
}

//
// Whether Linux has a file watch to spare. Other programs can use up every watch the user is allowed, and Vite then
// crashes with ENOSPC instead of watching the frontend.
//
function canWatchFiles(): boolean {
    try {
        watch('frontend').close();
        return true;
    }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOSPC') {
            return false;
        }
        throw error;
    }
}

const useWatchPolling = !canWatchFiles();
if (useWatchPolling) {
    console.warn('No file watches left on this machine, so Vite checks the frontend for changes by polling.');
}

export default defineConfig({
    plugins: [
        //
        // Tailwind's optimizer drops the @layer statement at the top of main.css, which puts
        // MaterialUI's layer after Tailwind's utilities, so MaterialUI's styles would beat
        // Tailwind's classes. The build sets minify to false, so the optimizer has no other job
        // here.
        //
        tailwindcss({
            optimize: false,
        }),
        classicScript(),
    ],
    server: {
        watch: {
            usePolling: useWatchPolling,
        },
    },
    root: 'frontend',
    base: './',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        minify: false,
        rollupOptions: {
            output: {
                format: 'iife',
                entryFileNames: 'assets/main.js',
            },
        },
    },
});
