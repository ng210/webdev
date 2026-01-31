import { glTextureFormatMap, glBufferType } from './glconstants.js'
import glTexture from './gltexture.js';
import glBuffer from './glbuffer.js';

export default class WebGL {
    //#region Statics
    static #extensions = {};
    //#endregion

    //#region Properties
    #textures = new Map();      // name -> glTexture
    #buffers = new Map();       // name -> glBuffer
    #framebuffers = new Map();  // name -> glFrameBuffer
    #programs = new Map();      // name -> glProgram

    gl = null;
    canvas = null;
    isInitialized = false;
    //#endregion

    //#region Creation, destruction
    constructor(canvas, options = {}) {
        if (canvas) {
            this.initialize(canvas, options);
        }
    }

    initialize(canvas, options = {}) {
        this.canvas = canvas;
        const gl = canvas.getContext("webgl2", options);
        if (!gl) throw new Error("WebGL2 not supported or failed to initialize.");
        this.gl = gl;
        // ... do other initializations
        this.isInitialized = true;
        console.info("✅ WebGL2 initialized successfully.");
    }

    destroy() {
        this.clearTextures();
        // ... clear other resource maps
        this.isInitialized = false;
        console.info("🧹 WebGL resources released.");
    }
    //#endregion

    //#region Extension handling
    useExtension(name) {
        if (WebGL.#extensions[name]) return WebGL.#extensions[name];
        const ext = this.gl.getExtension(name);
        if (!ext) {
            console.warn(`⚠️ Extension ${name} not available.`);
            return null;
        }
        WebGL.#extensions[name] = ext;
        return ext;
    }
    //#endregion

    async createBitmap(img) {
        let bitmap = img;
        if (img instanceof HTMLImageElement) {
            bitmap = await createImageBitmap(img);
        }
        return bitmap;
    }

    extractPixels(source) {
        const width = source.width;
        const height = source.height;
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(source, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = new Uint8Array(imageData.data.buffer.slice(0));
        return { data, width, height };
    }

    //#region Texture handling

    // Returns a texture by its tag.
    getTextureByTag(tag) {
        return this.#textures.get(tag) || null;
    }

	static #calculateTextureSize(count, forcePOT = true) {
		if (!forcePOT) {
			const width = Math.ceil(Math.sqrt(count));
			const height = Math.ceil(count / width);
			return [width, height];
		}

        let width = 1;
        while (width < count) width <<= 1;
        let height = 1;
        while (width > 2*height) {
            width >>= 1;
            height <<= 1;
        }

		const maxTexSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
		if (width > maxTexSize || height > maxTexSize) {
			throw new Error(`Texture size (${width}x${height}) exceeds GPU limit (${maxTexSize}).`);
		}

		return [width, height];
	}

    // Creates and registers a texture. 
    // `type` is one of the keys in TextureFormatMap.
    // If `options` provided, it overrides tag/type/width/height/data.
    createTexture(tag, options = {}) {
        if (!tag || typeof tag !== 'string') {
            throw new Error("Texture tag must be a non-empty string.");
        }

        const defaults = {
            type: 'float[4]',
            width: 256, height:256,
            forcePot: true,
            data: null };
        const opts = { ...defaults, ...options };
        const fmt = glTextureFormatMap[opts.type];
        if (!fmt) {
            throw new Error(`Unknown texture type: ${opts.type}`);
        }

        if ((!options.width || !options.height) && options.data) {
            const pixelCount = Math.ceil(opts.data.length / fmt.size);
            [opts.width, opts.height] = WebGL.#calculateTextureSize(pixelCount, opts.forcePot);
        }

        opts.formatInfo = fmt;
        const tex = new glTexture(this.gl, opts);
        this.#textures.set(tag, tex);
        return tex;
    }

    // Deletes a texture safely and removes it from registry.
    deleteTexture(tag) {
        const tex = this.#textures.get(tag);
        if (!tex) {
            console.warn(`Texture ${tag} not found.`);
        } else {
            tex.destroy();
            this.#textures.delete(tag);
        }
    }

    // Clears all registered textures.
    clearTextures() {
        for (const tex of this.#textures.values()) {
            tex.destroy();
        }
        this.#textures.clear();
    }
    //#endregion

    //#region Buffer handling
    #isTypedArray(data) {
        return (
            data instanceof Float32Array ||
            data instanceof Uint8Array ||
            data instanceof Uint16Array ||
            data instanceof Uint32Array);
    }

    #isImage(data) {
        return (
            data instanceof HTMLImageElement ||
            data instanceof ImageBitmap ||
            data instanceof HTMLCanvasElement);
    }

    #isEmptyBuffer(options) {
        return (
            (typeof options.width === "number" && options.width > 0) &&
            (typeof options.height === "number" && options.height > 0) &&
            !options.data);
    }

    #inferFormatFromTypedArray(data) {
        if (data instanceof Float32Array) return "float";
        if (data instanceof Uint8Array)   return "uint8";
        if (data instanceof Uint16Array)  return "uint16"; // if supported
        if (data instanceof Uint32Array)  return "uint32";
        return null;
    }

    #buildTypedArrayOptions(tag, options) {
        const { data } = options;

        // Infer element format if not explicitly set
        let elementType = this.#inferFormatFromTypedArray(data);
        if (!elementType) {
            throw new Error(`Cannot infer buffer format from typed array for "${tag}".`);
        }

        // Developer may override type
        const format = options.format || elementType;

        const fmt = glTextureFormatMap[format];
        if (!fmt) throw new Error(`Unknown buffer format "${format}" for "${tag}".`);

        // Determine width and height
        let width = options.width || data.length / fmt.size;
        let height = options.height || 1;

        if (!Number.isInteger(width)) {
            throw new Error(`TypedArray length does not match format size for buffer "${tag}".`);
        }

        return {
            tag,
            type: glBufferType.ARRAY,
            format: format,
            formatInfo: fmt,
            width, height,
            data,
            usage: options.usage || this.gl.STATIC_DRAW
        };
    }

    #buildImageOptions(tag, options) {
        const img = options.data;
        const format = options.format || "uint8[4]";
        const fmt = glTextureFormatMap[format];
        if (!fmt) {
            throw new Error(`Unsupported image format "${format}" for buffer "${tag}".`);
        }

         const { data, width, height } = this.extractPixels(img);

        return {
            tag,
            type: glBufferType.ARRAY,
            format,
            formatInfo: fmt,
            width: width,
            height: height,
            data: data,
            usage: options.usage || this.gl.STATIC_DRAW
        };
    }

    #buildEmptyBufferOptions(tag, options) {
        const format = options.format || "float[4]";
        const fmt = glTextureFormatMap[format];
        if (!fmt) throw new Error(`Invalid format "${format}" for empty buffer "${tag}".`);

        return {
            tag,
            type: glBufferType.ARRAY,
            format,
            formatInfo: fmt,
            width: options.width,
            height: options.height,
            data: null,
            usage: options.usage || this.gl.STATIC_DRAW
        };
    }

    createBuffer(tag, options = {}) {
        if (!tag || typeof tag !== "string") {
            throw new Error("Buffer tag must be a non-empty string.");
        }

        let opts = null;

        // 1) TypedArray branch
        if (this.#isTypedArray(options.data)) {
            opts = this.#buildTypedArrayOptions(tag, options);
            opts.isImage = false;
        }
        // 2) Image-like branch
        else if (this.#isImage(options.data)) {
            opts = this.#buildImageOptions(tag, options);
            opts.isImage = true;
        }
        // 3) Empty buffer branch
        else if (this.#isEmptyBuffer(options)) {
            opts = this.#buildEmptyBufferOptions(tag, options);
            opts.isImage = false;
        }
        else {
            throw new Error(`Invalid buffer creation parameters for "${tag}".`);
        }

        // Always validated and complete
        const buffer = new glBuffer(this.gl, opts);
        this.#buffers.set(tag, buffer);
        return buffer;
    }


    createFrameBuffer(tag, texture = null) {

    }

    deleteBuffer(tag) {

    }

    deleteFrameBuffer(tag) {

    }

    clearBuffers() {

    }

    clearFrameBuffer() {

    }
    //#endregion

    //#region Debugging
    glCheck(label) {
        const err = this.gl.getError();
        if (err !== this.gl.NO_ERROR) console.error(`[GL ERROR] ${label}: 0x${err.toString(16)}`);
    }
    //#endregion
}
