include('/base/dbg.js');
include('/synth/synth.js');
include('/ge/sound.js');

(function() {
    var counter = 0;
    async function main(msg) {
        switch (msg.code) {
            case 'startup':
                Dbg.prln('Worker started');
                count();
                msg.body = 'Counter started';
                self.postMessage(msg);
                break;
            case 'count':
                msg.body = counter;
                self.postMessage(msg);
                break;
            case 'kill':
                Dbg.prln('Worker killed');
                break;
        }
    }
    
    function count() {
        setInterval( () => {
            counter++;
            if ((counter % 10) == 0) {
                self.postMessage({
                    'code':'count',
                    'id': new Date().getTime(),
                    'body': counter+':'
                });
            }
        }, 1000);
    }

    publish(main, 'main');
})();
