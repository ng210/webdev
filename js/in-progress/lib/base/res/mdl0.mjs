
import { mdl1 } from './mdl1.mjs';
import { mdl2 } from "./mdl2.mjs";

function mdl0(txt) {
    mdl1('mdl0:');
    mdl2('mdl0:');
}

if (typeof Console !== 'undefined') {
    Console.getConsole().writeln('mdl0 loaded');
}    

export { mdl0 };