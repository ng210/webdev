import { poll } from '../util.mjs'
import { IConsole, Colors } from './iconsole.mjs'
import { html } from '../html.mjs';

class BrowserConsole extends IConsole {
    static #cons_ = null;
    #cons = null;
    #hasInput = false;

    constructor(lbl) {
        super();
        BrowserConsole.initColors();
        if (BrowserConsole.cons_ != null) delete BrowserConsole.cons_;
        BrowserConsole.cons_ = document.getElementById(lbl);
        if (!BrowserConsole.cons) {
            BrowserConsole.cons_ = document.createElement('console');
            BrowserConsole.cons_.id = 'cons';
            document.body.appendChild(BrowserConsole.cons_);
        }
        BrowserConsole.cons_.console = this;
        BrowserConsole.cons_.isClicked = false;
        BrowserConsole.cons_.style.opacity = 0.2;
        BrowserConsole.cons_.style.zIndex = 100;
        BrowserConsole.cons_.addEventListener('mouseover', BrowserConsole.onMouseEvent);
        BrowserConsole.cons_.addEventListener('mouseout', BrowserConsole.onMouseEvent);
        //document.addEventListener('click', BrowserConsole.onMouseEvent);
        this.cons = BrowserConsole.cons_;
   }

    wr(txt) {
        this.cons.innerHTML += `<span style="color:${this.color}">${html.encode(txt)}</span>`;
    }

    async prompt(question) {
         this.write(question + ': ');
        var input = document.createElement('INPUT');
        input.console = this;
        input.addEventListener('change', e => e.target.console.hasInput = true);
        this.cons.appendChild(input);
        await poll(cn => cn.hasInput, 100, this);
        this.hasInput = false;
        var answer = input.value;
        this.cons.removeChild(input);
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
            //el.style.width = '8em'; el.style.height = '1.5em';
            el.style.border = 'solid 1px gray';
            el.style.cursor = 'pointer';
            this.cons.appendChild(el);
        }
        await poll(() => answer != null);
        for (var oi=0; oi<optElems.length; oi++) {
            this.cons.removeChild(optElems[oi]);
        }
        this.writeln(answer);

        return answer;
    }

    static onMouseEvent(e) {
        var node = this;
        while (node) {
            if (node.console instanceof BrowserConsole) {
                switch (e.type) {
                    case 'mouseover':
                        if (!node.isClicked) node.style.opacity = 0.5; break;
                    case 'mouseout':
                        if (!node.isClicked) node.style.opacity = 0.2; break;
                    case 'click':
                        node.style.opacity = 0.75; cons.isClicked = true; break;
                }
                break;
            }
            node = node.parentNode;
        }
        if (!node && e.type == 'click') {
            BrowserConsole.cons.isClicked = false;
            BrowserConsole.cons.style.opacity = 0.2;
        }
    }

    static initColors() {
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