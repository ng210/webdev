export const glTextureFormatMap = {
    // --- integer textures ---
    "int8": { format: WebGL2RenderingContext.RED_INTEGER, internalFormat: WebGL2RenderingContext.R8I, type: WebGL2RenderingContext.BYTE, size: 1, bytes: 1 },
    "int8[2]": { format: WebGL2RenderingContext.RG_INTEGER, internalFormat: WebGL2RenderingContext.RG8I, type: WebGL2RenderingContext.BYTE, size: 2, bytes: 2 },
    "int8[3]": { format: WebGL2RenderingContext.RGB_INTEGER, internalFormat: WebGL2RenderingContext.RGB8I, type: WebGL2RenderingContext.BYTE, size: 3, bytes: 3 },
    "int8[4]": { format: WebGL2RenderingContext.RGBA_INTEGER, internalFormat: WebGL2RenderingContext.RGBA8I, type: WebGL2RenderingContext.BYTE, size: 4, bytes: 4 },

    "uint8": { format: WebGL2RenderingContext.RED_INTEGER, internalFormat: WebGL2RenderingContext.R8UI, type: WebGL2RenderingContext.UNSIGNED_BYTE, size: 1, bytes: 1 },
    "uint8[2]": { format: WebGL2RenderingContext.RG_INTEGER, internalFormat: WebGL2RenderingContext.RG8UI, type: WebGL2RenderingContext.UNSIGNED_BYTE, size: 2, bytes: 2 },
    "uint8[3]": { format: WebGL2RenderingContext.RGB_INTEGER, internalFormat: WebGL2RenderingContext.RGB8UI, type: WebGL2RenderingContext.UNSIGNED_BYTE, size: 3, bytes: 3 },
    "uint8[4]": { format: WebGL2RenderingContext.RGBA_INTEGER, internalFormat: WebGL2RenderingContext.RGBA8UI, type: WebGL2RenderingContext.UNSIGNED_BYTE, size: 4, bytes: 4 },

    // --- float textures ---
    "float": { format: WebGL2RenderingContext.RED, internalFormat: WebGL2RenderingContext.R32F, type: WebGL2RenderingContext.FLOAT, size: 1, bytes: 4 },
    "float[2]": { format: WebGL2RenderingContext.RG, internalFormat: WebGL2RenderingContext.RG32F, type: WebGL2RenderingContext.FLOAT, size: 2, bytes: 8 },
    "float[3]": { format: WebGL2RenderingContext.RGB, internalFormat: WebGL2RenderingContext.RGB32F, type: WebGL2RenderingContext.FLOAT, size: 3, bytes: 12 },
    "float[4]": { format: WebGL2RenderingContext.RGBA, internalFormat: WebGL2RenderingContext.RGBA32F, type: WebGL2RenderingContext.FLOAT, size: 4, bytes: 16 }
};

export const glBufferType = Object.freeze({
    ARRAY: 'array',
    ELEMENT: 'element',
    UNIFORM: 'uniform',
    STORAGE: 'storage',
    FRAME: 'frame'
});
