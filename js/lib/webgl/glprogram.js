import WebGL from './webgl.js'

export default class glProgram {
    constructor(webgl, options) {
        this.webgl = webgl;
        this.vertexSrc = options.vertexSrc;
        this.fragmentSrc = options.fragmentSrc;
        this.program = this.createShaderProgram(this.vertexSrc, this.fragmentSrc);
        this.attributes = this.extractAttributes();
        this.uniforms = this.extractUniforms();
        options.attributes = options.attributes || {};

        this.attributeBuffers = {};
        const buffers = this.attributeBuffers;
        for (let ak in this.attributes) {
            let attribute = this.attributes[ak];
            if (attribute.location != -1) {
                let attribInfo = options.attributes[ak];
                if (attribInfo) {
                    if (attribInfo.bufferId != undefined) attribute.bufferId = attribInfo.bufferId;
                    if (attribInfo.divisor != undefined) attribute.divisor = attribInfo.divisor;
                    if (attribInfo.offset != undefined) attribute.offset = attribInfo.offset;
                }

                if (attribute.bufferId == -1) attribute.bufferId = 0;
                if (attribute.divisor == -1) attribute.divisor = 0;

                let buffer = buffers[attribute.bufferId];
                if (buffer == undefined) {
                    buffer = buffers[attribute.bufferId] = { size: 0, stride: 0, attributes: [] };
                }
                buffer.attributes.push(attribute);
                if (attribute.offset == -1) attribute.offset = 4*buffer.size;
                let size = WebGL.typeMap[attribute.type].size;
                let stride = attribute.offset + size*4;
                if (buffer.stride < stride) {
                    buffer.stride = stride;
                }
                buffer.size += size;

//console.log(attribute.name, attribute.bufferId, attribute.offset, size, buffer.size, buffer.stride);
            }
        }
        // for (let bufferId in buffers) {
        //     let bufferInfo = buffers[bufferId];
        //     if (bufferInfo.size > 1) bufferInfo.stride = 4 * bufferInfo.size;
        // }

        let offset = 0;
        for (let uk in this.uniforms) {
            let uniform = this.uniforms[uk];
            if (uniform.location != -1) {
				// uniform.update = type.updater;
				// uniform.set = type.set;
				uniform.offset = offset;
				offset += uniform.size;
			}
        }
    }

    createShaderProgram(vertexSrc, fragmentSrc) {
        const gl = this.webgl.gl;
        const vs = this.compileShader(gl.VERTEX_SHADER, vertexSrc);
        const fs = this.compileShader(gl.FRAGMENT_SHADER, fragmentSrc);
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Shader program failed to link:", gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    compileShader(type, source) {
        const gl = this.webgl.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    extractAttributes() {
        const gl = this.webgl.gl;
        const program = this.program;
        const attributeCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        let attributes = {};
        for (let i = 0; i < attributeCount; i++) {
            const info = gl.getActiveAttrib(program, i);
            let type = WebGL.typeMap[info.type];
            if (!type) {
                console.warn(`Unsupported type ${info.type} for attribute ${info.name}`);
                continue;
            }
            attributes[info.name] = {
                name: info.name,
                size: info.size,
                type: info.type,
                location: gl.getAttribLocation(program, info.name),
                bufferId: -1,
                offset: -1,
                divisor: -1
            };
        }
        return attributes;
    }

    extractUniforms() {
        const gl = this.webgl.gl;
        const program = this.program;
        const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        let uniforms = {};
        for (let i = 0; i < uniformCount; i++) {
            const info = gl.getActiveUniform(program, i);
            let name = info.name;
            let type = info.type;
            if (name.endsWith('[0]')) {
                name = name.substring(0, name.indexOf('['));
                type = WebGL.FLOAT_ARR;
            }
            uniforms[name] = {
                name: info.name,
                size: info.size,
                type: type,
                location: gl.getUniformLocation(program, info.name),
                bufferId: -1,
                offset: 0,
                divisor: 0
            };
        }
        return uniforms;
    }

    use() {
        const gl = this.webgl.gl;
        gl.useProgram(this.program);
        for (let bufferId in this.attributeBuffers) {
            let bufferInfo = this.attributeBuffers[bufferId];
            const buffer = this.webgl.getBuffer(bufferId);
            if (!buffer) {
                console.warn(`Invalid buffer #${bufferId}!`);
                return;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
            for (let attribute of bufferInfo.attributes) {
                //console.warn(`Attribute ${attribute.name} not found`);
                this.setAttribute(attribute, bufferInfo);
            }
        }
    }

    setUniform(name, value) {
        const gl = this.webgl.gl;
        if (!(name in this.uniforms)) {
            console.warn(`Uniform ${name} not found`);
            return;
        }
        const typeInfo = WebGL.typeMap[this.uniforms[name].type];
        if (typeInfo && typeInfo.setter) {
            typeInfo.setter(gl, this.uniforms[name].location, value);
        } else {
            console.warn(`Unsupported uniform type for ${name}`);
        }
    }

    setAttribute(attribute, bufferInfo) {
        const gl = this.webgl.gl;
        const name = attribute.name;
        const typeInfo = WebGL.typeMap[attribute.type];
        if (!typeInfo) {
            console.warn(`Unsupported type ${attribute.type} for attribute ${name}`);
            return;
        }
        gl.enableVertexAttribArray(attribute.location);
        // index, size, type, normalized, stride, offset
        gl.vertexAttribPointer(
            attribute.location,
            typeInfo.size,
            //WebGL.typeMap[attribute.type].size,
            typeInfo.base,
            false,
            bufferInfo.stride,
            attribute.offset
        );
        if (attribute.divisor) gl.vertexAttribDivisor(attribute.location, attribute.divisor);
    }

    delete() {
        this.webgl.gl.deleteProgram(this.program);
    }
}
