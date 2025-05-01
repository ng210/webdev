import { getConsole, Colors } from './console.js'
import { Test } from '../test/test.js'

class ConsoleTests extends Test {
    #cons = null;

    async setupAll() {
        this.#cons = await getConsole();
    }

    async testWriteln() {
        this.#cons.writeln('This is a whole line.');
        await this.assert('Write a line', () => true);
    }

    async testColors() {
        this.cons.writeln('');
        var color = this.#cons.color;
        for (var ci in Colors) {
            this.#cons.color = Colors[ci];
            this.#cons.write('██');
        }
        this.#cons.color = color;
        this.#cons.writeln('');

        await this.assert('Write colors', () => true);
    }

    async testPrompt() {
        var answer = await this.cons.prompt('Type "hi"');
        this.#cons.writeln('');
        await this.assert('Prompt for \'hi\'', () => answer == 'hi');
    }

    async testChoice() {
        var answer = await this.cons.choice('Select', { 'O': 'Ok', 'C': 'Cancel'});
        this.#cons.writeln(`Selected '${answer}'`);
        await this.assert('Choose \'ok\' or \'cancel\'', () => answer == 'Ok' || answer == 'Cancel');
    }
}

export { ConsoleTests }