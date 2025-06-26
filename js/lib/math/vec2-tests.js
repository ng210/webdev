import Vec2 from './vec2.js'
import Test from '../test/test.js'

const COUNT = 10;

class Vec2Test extends Test {
    customPool = null;
    //customIndex = 0;
    setup() {
        Vec2.initialize(COUNT);
        this.customPool = new Float32Array(2 * COUNT);
    }

    teardown() {
        Vec2.destroy();
    }

    testPoolPreparation() {
        let mismatch = 0;
        for (let i=0; i<COUNT; i++) {
            let ix = Vec2.allocate();
            if (ix != 2*i) mismatch++;
        }
        this.isEqual(`Pool preparation correct`, mismatch, 0);
    }

    testPoolOverflow() {
        for (let i=0; i<COUNT; i++) {
            Vec2.allocate();
        }
        this.throws('Throws pool overflow', 'Pool overflow!', () => Vec2.allocate());
    }

    testFree() {
        let mismatch = 0;
        for (let i=0; i<COUNT; i++) {
            Vec2.allocate();
        }
        for (let i=0; i<COUNT; i++) {
            let ix = Vec2.free(i);
            if (i == 0 && ix != -1 || i > 0 && ix != 2*(i-1))
                mismatch++;
        }
        this.isEqual(`Free works correctly`, mismatch, 0);
    }

    testCreateVec2() {
        let ti = this.startTimer();
        for (let i=0; i<COUNT; i++) {
            new Vec2(i, COUNT - i);
        }
        this.stopTimer(`Create ${(COUNT/1000000).toPrecision(2)}M vectors`, ti);
        this.isEqual(`Created ${(COUNT/1000000).toPrecision(2)}M Vec2 instances`, Vec2.getPoolCount(), COUNT);

        let mismatch = 0;
        for (let i=0; i<Vec2.getPoolCount(); i++) {
            let v2 = Vec2.getAt(i);
            if (v2.x != i || v2.y != COUNT - i) mismatch++;
        }

        this.isEqual(`All ${COUNT} data is correct`, mismatch, 0);
    }

    testCreateVec2FromArray() {
        let ti = this.startTimer();
        let vectors = [];
        for (let i=0; i<COUNT; i++) {
            vectors.push(new Vec2(this.customPool, 2*i, i, COUNT - i));
        }
        this.stopTimer(`Create ${(COUNT/1000000).toPrecision(2)}M vectors`, ti);

        let mismatch = 0;
        for (let i=0; i<COUNT; i++) {
            if (this.customPool[2*i] != i || this.customPool[2*i + 1] != COUNT - i) mismatch++;
        }
        this.isEqual(`FloatArray data is correct`, mismatch, 0);
    }

    testAddVec2() {
        let v1 = new Vec2();
        let v2 = new Vec2(1, -1);
        let ti = this.startTimer();
        let maxValue = COUNT-2;
        for (let i=0; i<maxValue; i++) {
            v1.add(v2, v1);
        }
        this.stopTimer(`Add 2 vectors`, ti);
        this.isEqual('Result vector is correct', v1, new Vec2(maxValue, -maxValue));
    }
    
    testComplexVec2() {
        let ti = this.startTimer();
        let count = Math.floor((COUNT - 2)/2);
        let v3 = new Vec2();
        let v4 = new Vec2();
        for (let i=0; i<count; i++) {
            let v1 = new Vec2(1, -1);
            let v2 = new Vec2(2, -2);
            v1.add(v2, v3);     // v3 = v1 + v2
            v1.sub(v2, v4);     // v4 = v1 - v2
            v3.dec(v2);         // v3 = v3 - v2 = v1 + v2 - v2 = v1
            v4.inc(v2);         // v4 = v4 + v3 = v1 - v2 + v2 = v1
            v3.scale(2.0);      // v3 = 2*v1
            v4.scale(2.0);      // v4 = 2*v1
            v1.norm();
            v2.norm();
        }
        this.isEqual('Calucation is correct', v3, v4);
        this.cons.writeln(`Allocated ${Vec2.getPoolCount()} vectors.`);
        this.stopTimer(`Run a sequence of vector operations`, ti);
    }
    
    testComplexPreAllocVec2() {
        let ti = this.startTimer();
        let count = Math.floor(COUNT - 2)/2;
        let vectors = [];
        let v3 = new Vec2();
        let v4 = new Vec2();
        for (let i=0; i<count; i++) {
            vectors.push(new Vec2());
            vectors.push(new Vec2());
        }
        this.cons.writeln(`Allocated ${Vec2.getPoolCount()} vectors.`);
        for (let i=0; i<count; i++) {
            let v1 = vectors[2*i]
            v1.set(1, -1);
            let v2 = vectors[2*i + 1];
            v2.set(2, -2);
            v1.add(v2, v3);     // v3 = v1 + v2
            v1.sub(v2, v4);     // v4 = v1 - v2
            v3.dec(v2);         // v3 = v3 - v2 = v1 + v2 - v2 = v1
            v4.inc(v2);         // v4 = v4 + v3 = v1 - v2 + v2 = v1
            v3.scale(2.0);      // v3 = 2*v1
            v4.scale(2.0);      // v4 = 2*v1
            v1.norm();
            v2.norm();
        }
        this.isEqual('Calucation is correct', v3, v4);
        this.stopTimer(`Run a sequence of vector operations`, ti);
    }
}

export { Vec2Test };