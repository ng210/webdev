import { IConsole, Colors } from './iconsole.mjs'
import { html } from '../html.mjs';

class WorkerConsole extends IConsole {
    constructor(lbl) {
        super();
    }

    write(txt) {
        throw new Error('Not implemented!');
    }
};

export { WorkerConsole };