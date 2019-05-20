var fs = require('fs');
// var myservice1 = require('./myservice.js');

// var data = {

// };
// var req = {
//     body: JSON.stringify(data)
// };
// var resp = {};
// service.request(req, resp);

function envRun(timer, phase) {
    var smp = 0;
    var rate = 0;
    
    if (this.phase > 0) {
        
        switch (this.phase) {
            case 1:	// atk
                    // 0.0 : 0.005s -> 1/(0*3.995 + 0.005)/smpRate = 200/smpRate
                    // 1.0 : 4.0s -> 1/(1*3.995 + 0.005)/smpRate
                    //   X : Xs -> 1/(3.995*X + 0.005)/smpRate
                rate = 1/(48000 * (3.995 * 0.01/*this.atk*/ + 0.005));
                this.timer += rate;
                if (this.timer >= 1.0) {
                    this.phase++;
                    this.timer = 1.0;
                }
                smp = this.timer;
                //smp = smooth(this.timer);
                break;
            case 2:	// dec/sustain
                    // 0.0 : 0.005s -> 1/(0*3.995 + 0.005)/smpRate = 200/smpRate
                    // 1.0 : 4.0s -> 1/(1*3.995 + 0.005)/smpRate
                    //   X : Xs -> 1/(3.995*X + 0.005)/smpRate
                if (this.timer <= 0.4/*this.sus*/) {
                    this.timer = 0.4/*this.sus*/;
                } else {
                    rate = 1/(48000 * (3.995 * 0.1/*this.dec*/ + 0.005));
                    this.timer -= rate;
                    //var susm1 = 1- this.sus;
                    //smp = susm1*smooth((this.timer-this.sus)/susm1) + this.sus;
                }
                smp = this.timer;
                break;
            case 4:	// rel
                    // 0.0 :  0.005s -> 1/(0*9.995 + 0.005)/smpRate = 200/smpRate
                    // 1.0 : 10.0s -> 1/(1*9.995 + 0.005)/smpRate
                    //   X :  Xs -> 1/(9.995*X + 0.005)/smpRate
                rate = 1/(48000 * (9.995 * 0.2/*this.rel*/ + 0.005));
                this.timer -= rate;
                if (this.timer <= 0.0) {
                    this.phase = 0;	// set to idle
                    this.timer = 0.0;
                }
                smp = this.timer;
                //smp = this.sus*smooth(this.timer/this.sus);
                break;
        }
    }
    return smp;
};

var obj = {
    timer: 0,
    phase: 1
};
var bufSize = 2 * 48000;
var buffer = Buffer.alloc(bufSize*4);
for (var i = 0; i < bufSize; i++) {
    if (i == (bufSize>>2)) {
        obj.phase = 4;
    }
    buffer.writeFloatLE(envRun.call(obj) * Math.sin(0.028797932658*i), i<<2);
}
fs.writeFileSync("env.smp", buffer);
