include('input.js');
(function() {
    function Env(parent, controls) {
        this.parent = parent;
        this.gate = 0;
        this.velocity = 0;
        this.phase = psynth.Env.phase.IDLE;
        this.timer = 0;
        this.ticks = 0;
        this.rate = 0;
    
        this.amp = controls.amp;
        this.dc  = controls.dc;
        this.atk = controls.atk;
        this.dec = controls.dec;
        this.sus = controls.sus;
        this.rel = controls.rel;
    }

    Env.prototype.setGate = function setGate(velocity) {
        if (this.gate <= 0) {
            if (velocity > 0) {
                // slope up: retrigger envelope
                this.phase = psynth.Env.phase.UP;
                this.timer = 0;
                this.ticks = 0;
                this.gate = 1;
                this.velocity = velocity;
            }            
        } else {
            if (velocity <= 0) {
                // slope down: start release phase
                this.phase = psynth.Env.phase.DOWN;
                this.timer = this.sus.value;
                this.gate = 0;
            }
        }
    };

    Env.prototype.run = function run(am) {
        switch (this.phase) {
            case Env.phase.UP: // atk precalc
                // 0.0 : 0.005s -> 1/(0*3.995 + 0.005)/smpRate = 200/smpRate
                // 1.0 : 4.0s -> 1/(1*3.995 + 0.005)/smpRate = 4/smpRate
                //   X : Xs -> 1/(3.995*X + 0.005)/smpRate
                this.rate = 1/(this.parent.smpRate * (3.995 * this.atk.value + 0.005));
                this.phase++;
            case Env.phase.ATK: // atk
                this.timer += this.rate;
                if (this.timer >= 1.0) {
                    this.phase++;
                    this.timer = 1.0;
                }
                //smp = smooth(this.timer);
                break;
            case Env.phase.DEC: // dec precalc
                // 0.0 : 0.005s -> 1/(0*3.995 + 0.005)/smpRate = 200/smpRate
                // 1.0 : 4.0s -> 1/(1*3.995 + 0.005)/smpRate
                //   X : Xs -> 1/(3.995*X + 0.005)/smpRate
                this.rate = 1/(this.parent.smpRate * (3.995 * this.dec.value + 0.005));
                this.phase++;
            case Env.phase.SUS: // dec/sustain
                if (this.timer <= this.sus.value) {
                    this.timer = this.sus.value;
                } else {
                    this.timer -= this.rate;
                    //var susm1 = 1- this.sus;
                    //smp = susm1*smooth((this.timer-this.sus)/susm1) + this.sus;
                }
                break;
            case Env.phase.DOWN: // rel precalc
                // 0.0 :  0.005s -> 1/(0*9.995 + 0.005)/smpRate = 200/smpRate
                // 1.0 : 10.0s -> 1/(1*9.995 + 0.005)/smpRate
                //   X :  Xs -> 1/(9.995*X + 0.005)/smpRate
                this.rate = 1/(this.parent.smpRate * (9.995 * this.rel.value + 0.005));
                this.phase++;
            case Env.phase.REL: // rel
                this.timer -= this.rate;
                if (this.timer <= 0.0) {
                    this.phase = Env.phase.IDLE; // set to idle
                    this.timer = 0.0;
                }
                //smp = this.sus*smooth(this.timer/this.sus);
                break;
        }
        this.ticks++;
        return this.amp.value*am*this.timer*this.velocity + this.dc.value;
    };

    Env.createControls = function createControls() {
        return {
            'amp': new psynth.PotF32(0, 1, .5),
            'dc':  new psynth.PotF32(0, 1, .5),
            'atk': new psynth.PotF8(0, 1, .5),
            'dec': new psynth.PotF8(0, 1, .5),
            'sus': new psynth.PotF8(0, 1, .5),
            'rel': new psynth.PotF8(0, 1, .5)
        }
    };

    Env.phase = {
        UP:      1,
        ATK:     2,
        DEC:     3,
        SUS:     4,
        DOWN:    5,
        REL:     6,
        IDLE:    7
    };

    public(Env, 'Env', psynth);
})();
