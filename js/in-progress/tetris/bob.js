class Bob {
    constructor(classNames, parent) {
        // position
        this.position = [0, 0];
        this.targetPosition = [0, 0];
        this.distance = [0, 0];
        this.velocity = [0, 0];
        this.acceleration = [0, 0];
        this.elem = document.createElement('div');
        this.parent = parent;
        if (!Array.isArray(classNames)) classNames = [classNames];
        for (var cls of classNames)
            this.elem.classList.add(cls);
        this.width = 0;
        this.height = 0;
        this.parent.appendChild(this.elem);
        this.elem.bob = this;
        this.updateFunction = null;
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
    }

    update(dt) {
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
    }

    render() {
        this.elem.style.width = this.width + 'px';
        this.elem.style.height = this.height + 'px';
        this.elem.style.left = Math.round(this.position[0]) + 'px';
        this.elem.style.top = Math.round(this.position[1]) + 'px';
    }
}

export { Bob }