import { mdl2 } from "./mdl2.mjs";

function mdl1(txt) {
    mdl2('mdl1:' + txt);
}

if (typeof Console !== 'undefined') {
    Console.getConsole().writeln('mdl1 loaded');
}    


export { mdl1 };