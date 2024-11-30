import { IConsole, Colors } from './iconsole.js'
import { html } from '../html.js';

class WorkerConsole extends IConsole {
    constructor(lbl) {
        super();
    }

    write(txt) {
        throw new Error('Not implemented!');
    }
};

export { WorkerConsole };