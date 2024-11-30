var cons_ = null

function mdl2(txt) {
    cons_.writeln('mdl2:' + txt);
}

if (typeof Console !== 'undefined') {
    cons_ = Console.getConsole();
    cons_.writeln('mdl2 loaded');
}    

export { mdl2 };