import Particle from '../../lib/glui/particle.js'

const SpeedOfLight = 30;

class Star extends Particle {
    density;

    constructor() {
        super();
        this.position.set(0, 0);
        this.size = 1;
        this.density = 1;
        let r3 = 1**3;
        this.mass = 4*Math.PI*r3/3 * this.density;
        this.renderCallback = Star.defaultRender;
    }

    setPosition(v2) {
        this.position.set(v2.x, v2.y);
    }

    setRadius(r) {
        this.size = r;
        this.mass = 4*Math.PI*r**3/3 * this.density;
    }

    updateEnergy() {
        // E = m*c^2 + 0.5*m*v^2
        this.elapsed = this.mass*SpeedOfLight**2 + 0.5*this.mass*this.velocity.len2;
    }

    updateMass() {
        this.updateEnergy();
        this.size = Math.pow(3*this.mass / this.density / 4 / Math.PI, 1/3);
    }

    // update(frame, dt) {
    // }

    static defaultRender(ctx, frame, dt, star, alpha) {
        let r = star.size;
        let col = [255, 208, 160, 0];
        let a = star.elapsed / star.lifespan;
        if (star.data != 0 && this.elapsed < 5.0) {
            if (this.elapsed < 2.0) {
                col = [255, 255, 255, 0];
                a = this.elapsed / 2.0;
                r += 2*r*a;
            } else {
                let s = (5 - this.elapsed) / 3;
                r += 2*r*s;
                a += (1 - a) * s;
            }
        }
        col[3] = a;
        for (let i=4; i>=0; i--) {
            ctx.beginPath();
            ctx.fillStyle = 'rgb(' + col + ')';
            ctx.arc(star.position.x, star.position.y, r, 0, 2*Math.PI);
            col[3] *= 0.4;
            r = r * 1.12;
            ctx.fill();
        }
    }
};

export { Particle, Star }