import { Colors } from './iconsole.mjs'

var console_ = null;
async function getConsole(lbl) {
    if (console_ == null) {
        if (typeof window !== 'undefined') {
            var mod = await import('./browser-console.mjs');
            console_ = new mod.BrowserConsole(lbl);
        } else if (typeof self !== 'undefined') {
            mod = await import('./worker-console.mjs');
            console_ = new mod.WorkerConsole(lbl);
        } else {
            mod = await import('./cli-console.mjs');
            console_ = new mod.CliConsole(lbl);
        }
    }
    return console_;
}

export { getConsole, Colors };