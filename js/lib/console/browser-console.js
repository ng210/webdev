import { poll } from '/lib/util.js'
import { HTML } from '/lib/html.js';
import { IConsole, Colors } from './iconsole.js'

class BrowserConsole extends IConsole {
    static #cons = null;
    #container = null;
    //#hasInput = false;

    static get instance() {
        if (BrowserConsole.#cons == null) {
            BrowserConsole.#initColors();
            var cons = new BrowserConsole();
            cons.#container = document.createElement('console');
            cons.#container.console = this;
            BrowserConsole.#cons = cons;
        }

        return BrowserConsole.#cons;
    }

    append(parentId) {
        var parent = document.getElementById(parentId) || document.body;
        parent.appendChild(BrowserConsole.#cons.#container);
    }

    _write(txt) {
        this.#container.innerHTML += `<span style="color:${this.color}">${HTML.encode(txt)}</span>`;
    }

    async prompt(question) {
        this.write(question + ': ');
        var input = document.createElement('INPUT');
        input.console = this;
        input.addEventListener('change', e => e.target.console.hasInput = true);
        this.#container.appendChild(input);
        await poll(cn => cn.hasInput, 100, this);
        this.hasInput = false;
        var answer = input.value;
        this.#container.removeChild(input);
        this.write(answer);

        return answer;
    }

    async choice(question, options) {
        this.writeln(question);
        var answer = null;
        var optElems = [];
        for (var oi in options) {
            var el = document.createElement('BUTTON');
            optElems.push(el);
            el.innerHTML = options[oi];
            el.addEventListener('click',
                function(e) {
                    answer = this.innerHTML;
                }
            );
            el.style.border = 'solid 1px gray';
            el.style.cursor = 'pointer';
            this.#container.appendChild(el);
        }
        await poll(() => answer != null);
        for (var oi=0; oi<optElems.length; oi++) {
            this.#container.removeChild(optElems[oi]);
        }
        return answer;
    }

//     static onMouseEvent(e) {
//         var node = this;
//         while (node) {
//             if (node.console instanceof BrowserConsole) {
//                 switch (e.type) {
//                     case 'mouseover':
//                         if (!node.isClicked) node.style.opacity = 0.5; break;
//                     case 'mouseout':
//                         if (!node.isClicked) node.style.opacity = 0.2; break;
//                     case 'click':
//                         node.style.opacity = 0.75; cons.isClicked = true; break;
//                 }
//                 break;
//             }
//             node = node.parentNode;
//         }
//         if (!node && e.type == 'click') {
//             BrowserConsole.cons.isClicked = false;
//             BrowserConsole.cons.style.opacity = 0.2;
//         }
//     }

    static #initColors() {
        Colors.Black =        'black',
        Colors.Red =          'maroon',
        Colors.Green =        'green',
        Colors.Yellow =       'olive',
        Colors.Blue =         'navy',
        Colors.Magenta =      'purple',
        Colors.Cyan =         'teal',
        Colors.LightGray =    'silver',

        Colors.Gray =         'gray',
        Colors.LightRed =     'red',
        Colors.LightGreen =   'lime',
        Colors.LightYellow =  'yellow',
        Colors.LightBlue =    'blue',
        Colors.LightMagenta = 'fushsia',
        Colors.LightCyan =    'cyan',
        Colors.White =        'white'
    }
};

export { BrowserConsole, Colors };