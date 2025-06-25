class FltStage {
    ai = new Array(3);    // nominator coeffs
    bi = new Array(3);    // LP denominator coeffs
    ci = new Array(3);    // HP denominator coeffs
    ui = new Array(3);    // LP inputs
    vi = new Array(3);    // HP inputs
    lp = new Array(2);    // LP outputs
    hp = new Array(2);    // HP outputs

    constructor() {
        this.ai.fill(0);
        this.bi.fill(0);
        this.ci.fill(0);
        this.ui.fill(0);
        this.vi.fill(0);
        this.lp.fill(0);
        this.hp.fill(0);
    }

    run() { throw new Error('Not implemented!'); }
    update(e, g) { throw new Error('Not implemented!'); }
}
    
class FltStage1Pole extends FltStage {
    constructor() {
        super();
        this.ci[0] = 1.0;
        this.ci[1] = -1.0;
    }

    run() {
        // let gain = 1.0f / ai_[0];
        // y0 = (b0*u0 + b1*u1 - a1*y1)/a0
        let lp = (this.bi[0] * this.ui[0] + this.bi[1] * this.ui[1] - this.ai[1] * this.lp[0]) / this.ai[0];        // * gain;
        let hp = (this.ci[0] * this.vi[0] + this.ci[1] * this.vi[1] - this.ai[1] * this.hp[0]) / this.ai[0];
        this.ui[1] = this.ui[0];
        this.vi[1] = this.vi[0];
        this.lp[0] = lp;
        this.hp[0] = hp;
    }
        
    update(e, g) {
        this.bi[0] = this.bi[1] = e;
        // this.ci[0] = 1.0;
        // this.ci[1] = -1.0;
        this.ai[0] = e + 1;
        this.ai[1] = e - 1;
    }
}

class FltStage2Pole extends FltStage {
    #linearFactor = 1;
    constructor(linearFactor = 1) {
        super();
        this.#linearFactor = linearFactor;
        this.ci[0] = this.ci[2] = 1.0;
        this.ci[1] = -2.0;
    }
    
    run() {
        //var gain = 1.0f / ai_[0];
        // y0 = (b0*u0 + b1*u1 + b2*u2 - a1*y1 - a2*y2)/a0
        let lp = (this.bi[0] * this.ui[0] + this.bi[1] * this.ui[1] + this.bi[2] * this.ui[2] - this.ai[1] * this.lp[0] - this.ai[2] * this.lp[1]) / this.ai[0];    // * gain;
        let hp = (this.ci[0] * this.vi[0] + this.ci[1] * this.vi[1] + this.ci[2] * this.vi[2] - this.ai[1] * this.hp[0] - this.ai[2] * this.hp[1]) / this.ai[0];
        this.ui[2] = this.ui[1]; this.ui[1] = this.ui[0];
        this.vi[2] = this.vi[1]; this.vi[1] = this.vi[0];
        this.lp[1] = this.lp[0]; this.lp[0] = lp;
        this.hp[1] = this.hp[0]; this.hp[0] = hp;
    }
    
    update(e, g) {
        g *= this.#linearFactor;
        var b0 = e * e;
        this.bi[0] = this.bi[2] = b0; this.bi[1] = 2.0 * b0;
        this.ai[0] = b0 + 1 - g;
        this.ai[2] = b0 + 1 + g;
        this.ai[1] = 2.0 * (b0 - 1);
    }
}

class Flt {
    static modes = { NP: 0, LP: 1, BP: 2, HP: 3, BR: 4, AP: 5 };
    mode = 0;
    #stages = [];
    #stageCount = 0;

    constructor(poleCount = 1) {
        switch (poleCount) {
            case 1:
                this.#stages.push(new FltStage1Pole());
                this.#stageCount = 1;
                break;
            case 2:
                this.#stages.push(new FltStage2Pole(Math.SQRT2));
                this.#stageCount = 1;
                break;
        }
    }

    run(u0) {
        let lp = u0;
        let hp = lp;

        for (let i = 0; i < this.#stageCount; i++) {
            let stage = this.#stages[i];
            stage.ui[0] = lp;
            stage.vi[0] = hp;
            stage.run();
            lp = stage.lp[0];
            hp = stage.hp[0];
        }

        // hp = u0 - lp;
        let output = u0;
        switch (this.mode) {
            case 0: output = 0.0; break;
            case 1: output = lp; break;
            case 2: output = u0 - hp - lp; break;
            case 3: output = hp; break;
            case 4: output = lp + hp; break;
            case 5: break;
        }
        return output;
    }

    update(cut, res) {
        let q = res < 0.000001 ? 1.0 : 1.0 - res;
        let e = 0.5 * cut * cut * Math.PI;
        if (e <= 0) e = 0.001;
        let g = -q * e;

        for (var i = 0; i < this.#stageCount; i++) {
            this.#stages[i].update(e, g);
        }
    }
}

export { FltStage, FltStage1Pole, FltStage2Pole, Flt }