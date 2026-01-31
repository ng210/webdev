export default class glTexture {
    constructor(gl, opts) {
        this.gl = gl;
        this.tag = opts.tag;

        this.width = opts.width;
        this.height = opts.height;

        this.formatInfo = opts.formatInfo;  // from glTextureFormatMap
        this.data = opts.data;              // typed array or null

        // Optional sampler settings (with fallback)
        this.minFilter = opts.minFilter ?? gl.NEAREST;
        this.magFilter = opts.magFilter ?? gl.NEAREST;
        this.wrapS     = opts.wrapS ?? gl.CLAMP_TO_EDGE;
        this.wrapT     = opts.wrapT ?? gl.CLAMP_TO_EDGE;

        // Create texture
        this.handle = gl.createTexture();
        if (!this.handle) {
            throw new Error(`Failed to create texture: ${this.tag}`);
        }

        gl.bindTexture(gl.TEXTURE_2D, this.handle);

        // Sampler parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);

        // Upload
        this.#upload();

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    #upload() {
        const gl = this.gl;
        const fmt = this.formatInfo;

        // Allocate and optionally upload data
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,                  // mip level
            fmt.internalFormat, // GPU internal format
            this.width,
            this.height,
            0,                  // border
            fmt.format,         // pixel format
            fmt.type,           // data type
            this.data ?? null   // actual upload or null alloc
        );
    }

    bind(unit = 0) {
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, this.handle);
    }

    update(data) {
        const gl = this.gl;
        const fmt = this.formatInfo;

        gl.bindTexture(gl.TEXTURE_2D, this.handle);

        gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            0, 0,                   // x,y offset
            this.width,
            this.height,
            fmt.format,
            fmt.type,
            data
        );

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    destroy() {
        if (this.handle) {
            this.gl.deleteTexture(this.handle);
            this.handle = null;
        }
    }
}
