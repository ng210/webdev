#define MAXLENGTH 255

precision mediump float;

uniform int uFrame;
uniform vec2 uSize;

uniform vec4 uText[MAXLENGTH];
uniform int uTextLength;
uniform vec4 uColor;
uniform vec4 uBgColor;

uniform vec3 uFontSize;
//uniform vec3 uFontData[64];
uniform sampler2D uFontTexture;

float inRect(vec2 v, vec2 topRight, vec2 bottomLeft) {
    vec2 s = step(bottomLeft, v) - step(topRight, v);
    return s.x * s.y;   
}

vec2 getTextRect() {
    vec2 rect = vec2(0.0, uFontSize.z);
    for (int i=0; i<MAXLENGTH; i++) {
        vec4 font = uText[i];
        rect.x += font.z;
        rect.y = max(rect.y, font.w);
    }
    return rect;
}

vec4 drawRect(vec2 uv, vec2 pos, vec2 size, vec4 color) {
    return inRect(uv, pos, pos + size) == 1.0 ? color : vec4(0.0);
}

vec4 drawFont(vec4 font, vec2 uv, vec2 size, vec4 color) {
    vec2 scale = size/font.zw;
    if (uv.y < scale.y*(uFontSize.z - font.w)) return vec4(0.0);
    uv.y -= scale.y*(uFontSize.z - font.w);
    uv /= size;
    vec2 texCoord = (font.zw * uv + font.xy)/uFontSize.xy;
    vec3 shade = mix(vec3(0.8), uv.xyx, 0.8);
    return color * texture2D(uFontTexture, texCoord) * vec4(shade, 1.0);
}

vec4 drawText(vec2 uv, vec2 pos, vec2 size, vec4 color) {
    vec4 col = vec4(0.0);
    if (uv.x >= pos.x && uv.y >= pos.y) {
    //if (inRect(uv, pos, pos + size) == 1.0) {
        vec2 rect = getTextRect();
        size = mix(rect, size, step(0.0, size));
        if (uv.x < pos.x+size.x && uv.y < pos.y+size.y) {
        //if (uv.x < pos + size)) {
            vec2 scale = size/rect;
            for (int i=0; i<MAXLENGTH; i++) {
                vec4 font = uText[i];
                size = font.zw*scale;
                if (uv.x < pos.x + size.x) {
                    col = drawFont(font, uv-pos, size, color);
                    break;
                }
                pos.x += size.x;
            }
        }
    }
    return col;
}

void main() {
    vec2 uv = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
    vec4 finalColor = vec4(0.0);
    vec4 color;

    vec2 size = vec2(300.0, 48.0);
    vec2 pos = (uSize - size) * (0.5 + vec2(0.24, 0.16) * vec2(cos(float(uFrame)*0.06), sin(float(uFrame)*0.12)));

    color = drawRect(uv, pos, size, uBgColor);
    finalColor = mix(finalColor, color, color.a);

    float opacity = 1.0;
    for (int i=0; i<5; i++) {
        color = drawText(uv, pos, size, uColor);
        finalColor = mix(finalColor, color, color.a * opacity);
        vec2 newSize = size * (1.0 + 0.1*sin(float(uFrame)*0.5));
        pos += 0.5*(size - newSize);
        size = newSize;
        opacity *= 0.5;
    }

    gl_FragColor = finalColor;
}
