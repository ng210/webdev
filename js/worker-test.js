include('/synth/synth.js');

(function() {

    function main() {
        Dbg.prln('MAIN');
        self.postMessage({code:'kill', id:0, data:`Worker terminated!`});
    }

    public(main, 'main');
})();
