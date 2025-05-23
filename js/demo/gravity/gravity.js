import Demo from '/js/demo/base/demo.js'
import Vec2 from '/js/lib/math/vec2.js'
import { Particle, Star } from './star.js';

export default class Gravity extends Demo {
    #stars = [];
    sun = null;
    static #center = null;

    get size() {
        return [960, 525];
    }

    constructor() {
        super();
        this.settings = {
            time:       { value: 60,    min:1,      max:200,    step: 10 },
            count:      { value: 501,   min:1,      max:5001,   step: 50 },
            size:       { value: 2,     min:1,      max:10,     step: 0.5 },
            gravity:    { value: 0.01,  min:-0.1,   max:0.1,    step: 0.01 },
            velocity:   { index: 1,     values: ['Random', 'Orbit', 'None'] }
        };
    }

    async initialize() {
        super.initialize();
        Particle.initializePool(this.settings.count.max);
        Vec2.initializePool(256);
        Gravity.#center = new Vec2(this.frontBuffer.width/2, this.frontBuffer.height/2);
        this.sun = new Star();
        this.resetStar(this.sun, Gravity.#center, 8.0, 4.0);
        this.sun.velocity.set(0, 0);
        this.sun.forces.push((p, fr, dt) => this.frc_gravity(p, fr, dt));
        this.sun.constraints.push((p, fr, dt) => this.cst_energy(p, fr, dt));
        this.sun.isActive = true;
        this.sun.data = 0;
        this.#stars.push(this.sun);
        this.addStars();
    }

    onChange(id, value) {
        if (id == 'count') {
            this.stop();
            setTimeout(() => {
                this.addStars();
                this.start();
            }, 100);
        }
        return true;
    }


    update(frame, dt) {
        for (let i=0; i<this.settings.count.value; i++) {
            let star = this.#stars[i];
            star.update(null, dt/this.settings.time.value)
        }
    }

    render(frame, dt) {
        const ctx = this.frontBuffer.context;
        this.frontBuffer.clear();
        for (let star of this.#stars) {
            if (star.isActive) {
                star.render(ctx, frame, dt/this.settings.time.value);
            }
        }
    }

    // #randomVector() {
    //     let theta = Math.random()*2*Math.PI;
    //     let rad = Math.random();
    //     return new Vec2(rad*Math.cos(theta), rad*Math.sin(theta));
    // }

    addStars() {
        const count = this.settings.count.value;
        for (let i=this.#stars.length; i<count; i++) {
            let star = new Star();
            this.resetStar(star);
            star.forces.push((p, fr, dt) => this.frc_gravity(p, fr, dt));
            star.constraints.push((p, fr, dt) => this.cst_energy(p, fr, dt));
            star.isActive = true;
            this.#stars.push(star);
            star.data = i;
        }
    }

    frc_gravity(star, frame, dt) {
        let g = this.settings.gravity.value;
        for (let i=star.data; i<this.settings.count.value; i++) {
            let other = this.#stars[i];
            if (star != other) {
                if (this.resolveCollision(star, other, frame, dt)) {
                    break;
                }
                // F = g*(m1+m2)/r^2
                // F1 = g*m2/r^2
                // F2 = g*m1/r^2
                let dx = other.position.x - star.position.x;
                let dy = other.position.y - star.position.y;
                let r2 = dx*dx + dy*dy;
                let d = Math.sqrt(r2);
                // a1 = F1/m1 = g*m2/m1/r^2
                // a2 = F2/m2 = g*m1/m2/r^2
                let a1 = g*other.mass/star.mass/r2;
                star.acceleration.x += a1 * dx/d;
                star.acceleration.y += a1 * dy/d;
                let a2 = g*star.mass/other.mass/r2;
                other.acceleration.x -= a2 * dx/d;
                other.acceleration.y -= a2 * dy/d;
            }
        }
        if (this.settings.velocity.value == 'Orbit') {
            this.calculateOrbit(star);
        }
    }

    cst_energy(star) {
        if (star.elapsed <= 0) {
            this.resetStar(star);
        }
    }

    resolveCollision(a, b, frame, dt) {
        // detect collision depending on object trajectories
        let cp = a.checkCollision(b, frame, dt);
        if (cp) {
            if (a.mass < b.mass) {
                // swap to make a the heavier one
                var c = a; a = b; b = c;
            }
            // calculate velocity from momentum
            // l = m1*v1 + m2*v2
            let tmp1 = new Vec2(0, 0);
            let tmp2 = new Vec2(0, 0);
            a.velocity.mul(a.mass, tmp1);
            b.velocity.mul(b.mass, tmp2);
            tmp1.add(tmp2, a.velocity);
            Vec2.free(2);
            // v = l/(m1+m2)
            a.mass += b.mass;
            let energy = a.elapsed;
            a.updateMass();
            a.lifespan *= a.elapsed / energy;
            a.velocity.scale(1/a.mass);
            this.resetStar(b);
        }
        return false;
    };

    calculateOrbit(star) {
        // g*m*M/r^2 = m*v^2/r
        // g*M/r = v^2
        // v = sqrt(g*M/r)
        let r = this.sun.position.dist(star.position);
        let v = r > 0 ? Math.sqrt(this.settings.gravity.value*this.sun.mass/r) : 0;
        let arg = Math.atan2(this.sun.position.y - star.position.y, this.sun.position.x - star.position.x);
        star.velocity.set(
            -v * Math.sin(arg),
            v * Math.cos(arg)
        );
    }

    resetStar(star, pos, rad, density) {
        // c2 = center*(1 + 0.2*rnd+0.3*|rnd|)
        // rnd
        let rnd = Vec2.random().scale(Math.random());
        // 0.2*|rnd|
        let n2 = rnd.clone().norm().scale(0.4);
        // 0.6*rnd+0.2*|rnd|
        rnd.scale(0.3).inc(n2);
        // center + center*rnd
        rnd.x = (rnd.x + 1) * Gravity.#center.x;
        rnd.y = (rnd.y + 1) * Gravity.#center.y;
        star.setPosition(pos || rnd);

        switch (this.settings.velocity.value) {
            case 'Random':
                let v2 = Vec2.random().scale(2.0)
                star.velocity.set(v2.x, v2.y);
                Vec2.free(1);
                break;
            case 'Orbit':
                this.calculateOrbit(star);
                break;
        }
        Vec2.free(2);
        star.density = density || 1.0;
        star.setRadius(rad || 0.5*(1 + Math.random())*this.settings.size.value/2);
        star.updateEnergy();
        star.lifespan = star.elapsed;
    }
}
