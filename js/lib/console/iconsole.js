class IConsole {
    #color = DefaultColor;
    get color() {
        return this.#color;
    }
    set color(col) {
        this.#color = Object.values(Colors).indexOf(col) != -1 ? col : DefaultColor;
    }

    _write(txt) {
        throw new Error('Not Implemented!');
    }

    write(txt, ink) {
        if (ink != undefined) {
            var color = this.#color;
            this.#color = ink;
            this._write(txt);
            this.#color = color;
        } else {
            this._write(txt);
        }
    }

    writeln(txt, ink) {
        this.write(txt + '\n', ink);
    }

    log(txt) {
        this.writeln(txt);
    }

    debug(txt) {
        this.writeln(txt);
    }

    error(err) {
        var txt = err.toString();
        this.writeln(txt, Colors.LightRed); }

    async prompt(question) {
        throw new Error('Not Implemented!');
    }

    async choice(question, options) {
        throw new Error('Not Implemented!');
    }
}

const Colors = {
    'Black':        'black',
    'Red':          'red',
    'Green':        'green',
    'Yellow':       'yellow',
    'Blue':         'blue',
    'Magenta':      'magenta',
    'Cyan':         'cyan',
    'LightGray':    'lightgray',

    'Gray':         'gray',
    'LightRed':     'lightred',
    'LightGreen':   'lightgreen',
    'LightYellow':  'lightyellow',
    'LightBlue':    'lightblue',
    'LightMagenta': 'lightmagenta',
    'LightCyan':    'lightcyan',
    'White':        'white'
};

const DefaultColor = Colors.LightGreen;

export { IConsole, Colors, DefaultColor };