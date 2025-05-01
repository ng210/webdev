import { getConsole } from './lib/console/console.js'
import { Path, CurrentDir } from './lib/loader/path.js';

window.addEventListener('load', async function main() {
    var _cons = await getConsole();
    _cons.writeln('Current path: ' + CurrentDir);
});