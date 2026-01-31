export default class glBuffer {
    constructor(gl, opts) {
        this.gl = gl;
        this.tag = opts.tag;
        this.target = opts.target;
        this.usage = opts.usage;
        this.width = opts.width;
        this.height = opts.height;
        this.formatInfo = opts.formatInfo;
        this.data = opts.data;

        // Create the actual GL buffer
        this.handle = gl.createBuffer();
        if (!this.handle) {
            throw new Error(`Failed to create buffer: ${this.tag}`);
        }

        gl.bindBuffer(this.target, this.handle);

        if (this.data) {
            // Direct upload
            gl.bufferData(this.target, this.data, this.usage);
        } else {
            // Allocate empty buffer
            const byteSize = this.width * this.height * this.formatInfo.bytes;
            gl.bufferData(this.target, byteSize, this.usage);
        }

        gl.bindBuffer(this.target, null);
    }

    bind() {
        this.gl.bindBuffer(this.target, this.handle);
    }

    unbind() {
        this.gl.bindBuffer(this.target, null);
    }

    update(data, offset = 0) {
        const gl = this.gl;
        gl.bindBuffer(this.target, this.handle);
        gl.bufferSubData(this.target, offset, data);
        gl.bindBuffer(this.target, null);
    }

    destroy() {
        if (this.handle) {
            this.gl.deleteBuffer(this.handle);
            this.handle = null;
        }
    }
}
