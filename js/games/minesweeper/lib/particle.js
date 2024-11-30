class Particle {
    constructor(className, parent) {
        this.lifeSpan = 0;
        this.position = [0, 0];
        this.targetPosition = [0, 0];
        this.distance = [0, 0];
        this.velocity = [0, 0];
        this.acceleration = [0, 0];
        this.elem = document.createElement('div');
        this.parent = parent;
        this.elem.classList.add(className);
        this.width = 0;
        this.height = 0;
        //this.update(0);
        this.parent.appendChild(this.elem);
        this.elem.bob = this;
        this.updateFunction = null;
        this.maxLifeSpan = -Number.MIN_SAFE_INTEGER;
    }

    static SpringParameters = {
        k: 0.1,
        resistance: 0.3
    };

    static GravityParameters = {
        f: 0.1,
        resistance: 0.3
    };

    setSize(width, height) {
        this.width = width;
        this.height = height;
    }

    update(dt) {
        var isAlive = true;
        this.lifeSpan += dt;
        if (this.lifeSpan < this.maxLifeSpan) {
            if (dt > 4) dt = 4;
            this.distance[0] = this.position[0] - this.targetPosition[0];
            this.distance[1] = this.position[1] - this.targetPosition[1];
            this.distance[2] = this.distance[0]*this.distance[0] + this.distance[1]*this.distance[1];
            this.impulse = this.velocity[0]*this.velocity[0] + this.velocity[1]*this.velocity[1];
            if (this.updateFunction) {
                this.updateFunction(this, dt);
            }
            this.position[0] += this.velocity[0] * dt;
            this.position[1] += this.velocity[1] * dt;
            if (this.distance[2] < 1 && this.impulse < 1) {
                this.position[0] = this.targetPosition[0];
                this.velocity[0] = 0;
                this.position[1] = this.targetPosition[1];
                this.velocity[1] = 0;
            } else {
                this.velocity[0] += this.acceleration[0] * dt;
                this.velocity[1] += this.acceleration[1] * dt;
            }
        } else {
            this.remove();
            isAlive = false;
        }

        return isAlive;
    }

    render() {
        this.elem.style.width = this.width + 'px';
        this.elem.style.height = this.height + 'px';
        this.elem.style.left = Math.round(this.position[0]) + 'px';
        this.elem.style.top = Math.round(this.position[1]) + 'px';
    }

    remove() {
        this.parent.removeChild(this.elem);
    }

    static springPhysics(particle, dt) {
        var dx = particle.distance[0];
        if (dx > 100) dx = 100;
        else if (dx < -100) dx = -100;
        var dy = particle.distance[1];
        if (dy > 100) dy = 100;
        else if (dy < -100) dy = -100;
        particle.acceleration[0] = -Particle.SpringParameters.k * dx - Particle.SpringParameters.resistance * particle.velocity[0];
        particle.acceleration[1] = -Particle.SpringParameters.k * dy - Particle.SpringParameters.resistance * particle.velocity[1];
    }
    
    static gravityPhysics(particle, dt) {
        var ds = Math.sqrt(particle.distance[2]);
        var f = -Particle.GravityParameters.f / particle.distance[2];
        if (f > 1) f = 1;
        else if (f < -1) f = -1;
        particle.acceleration[0] = f * particle.distance[0] / ds - GravityParameters.resistance * particle.velocity[0];
        particle.acceleration[1] = f * particle.distance[1] / ds - GravityParameters.resistance * particle.velocity[1];
        if (particle.distance[2] < 50) {
            particle.position[0] = particle.targetPosition[0];
            particle.velocity[0] = 0;
            particle.position[1] = particle.targetPosition[1];
            particle.velocity[1] = 0;
        }
    }
}

export { Particle }