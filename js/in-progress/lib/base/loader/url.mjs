import { Path } from './path.mjs';
//import { clone } from '../util.mjs';

class Url {
    constructor(input, base) {
        input = input || '';
        base = base || Url.Base;
        if (input.match(/^[a-zA-Z]:/)) {
            input = 'file://' + input;
        }
        else if ((input.startsWith('/') || input.startsWith('\\')) && typeof window === 'undefined') {
            input = Url.#DocumentRoot_ + input.substring(1);
        }
        // var url = new URL(input, base);
        // if (typeof self === 'undefined' && url.protocol.startsWith('file:')) {
        //     input = '***input: file://' + Path.normalize(Path.dirname(url.pathname));
        // }
        return new URL(input, base);
    }

    static Base = typeof self !== 'undefined' ?
        new URL(Path.dirname(document.location.href) + '/') :
        new URL('file://' + process.cwd()  + '/');

    static #DocumentRoot_ = '';
    static getDocumentRoot() { return Url.#DocumentRoot_; }
    static setDocumentRoot(path) {
        Url.#DocumentRoot_ = Path.normalize(path);
        if (!Url.#DocumentRoot_.endsWith(Path.sep)) Url.#DocumentRoot_ += Path.sep;
    }
}

export { Url };
