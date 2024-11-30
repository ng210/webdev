class IConsole {
    #color_ = Colors.White;
    get color() { return this.#color_; }
    set color(col) { this.#color_ = col; }

    static #console_ = null;
    getConsole() { return IConsole.console_; }

    constructor() {
        if (this.getConsole() == null) {
            IConsole.console_ = this;
        } else {
            throw new Error('Cannot instantiate console more than once!');
        }
        this.color = Colors.LightGray;
    }

    wr(txt) { throw new Error('Not Implemented!'); }
    write(txt, ink) {
        if (ink != undefined) {
            var color = this.#color_;
            this.#color_ = ink;
            this.wr(txt);
            this.#color_ = color;
        } else {
            this.wr(txt);
        }
    }
    writeln(txt, ink) { this.write(txt + '\n', ink); }
    error(txt) {
        this.writeln(txt, Colors.LightRed);
    }
    async prompt(question) { throw new Error('Not Implemented!'); }
    async choice(question, options) { throw new Error('Not Implemented!'); }
    static getConsole() {
        if (IConsole.console_)
        return IConsole.console_;
    }
}

const Colors = {
    'Black':            'black',
    'Red'  :            'red',
    'Green':            'green',
    'Yellow'   :        'yellow',
    'Blue' :            'blue',
    'Magenta'  :        'magenta',
    'Cyan' :            'cyan',
    'LightGray':        'lightgray',
    'Gray' :            'gray',
    'LightRed' :        'lightred',
    'LightGreen'   :    'lightgreen',
    'LightYellow'  :    'lightyellow',
    'LightBlue':        'lightblue',
    'LightMagenta' :    'lightmagenta',
    'LightCyan':        'lightcyan',
    'White':            'white'
};

export { IConsole, Colors };