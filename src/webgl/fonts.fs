#define MAXLENGTH 255
#define PI 3.1415926535897932384626433832795

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

vec4 drawFont(vec4 font, vec2 uv, vec2 size, vec4 color) {
    vec2 scale = size/font.zw;
    if (uv.y < scale.y*(uFontSize.z - font.w)) return vec4(0.0);
    uv.y -= scale.y*(uFontSize.z - font.w);
    uv /= size;
    vec2 texCoord = (font.zw * uv + font.xy)/uFontSize.xy;
    //vec3 shade = mix(vec3(0.8), uv.xyx, 0.8);
    return color * texture2D(uFontTexture, texCoord);   // * vec4(shade, 1.0);
}

vec4 drawText(vec2 uv, vec2 pos, vec2 size, vec4 color) {
    vec4 col = vec4(0.0);
    if (uv.x >= pos.x && uv.y >= pos.y) {
        vec2 rect = getTextRect();
        size = mix(-size*rect, size, step(0.0, size));
        if (uv.x < pos.x+size.x && uv.y < pos.y+size.y) {
            vec2 scale = size/rect;
            for (int i=0; i<MAXLENGTH; i++) {
                if (i == uTextLength) break;
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
    float frame = float(uFrame);

    vec2 size = vec2(-1, 100.0);  //vec2(23.0, 22.0);
    vec2 pos = 0.5*(uSize - size);
    float opacity = 1.0;
    float d = mod(frame, 300.0);
    float f = d/300.0;
    pos -= d*vec2(1.2, 0.1);
    float lum = 1.0, dist = 0.0;
    if (d < 50.0) { opacity = d/50.0; dist = 2.0 + (50.0 - d)/2.0; }
    else if (d < 150.0) { lum *= 1.0 + (d - 50.0)/75.0; dist = (150.0 - d)/50.0; }
    else if (d < 250.0) { lum *= 1.0 + (250.0 - d)/75.0; dist = (d - 150.0)/50.0; }
    else { opacity = (300.0 - d)/50.0; dist = 2.0 + (d - 250.0)/2.0; }
    size *= 1.0 + f*f*vec2(0.8, 0.01);
    vec2 xy = 20.0*uv.yx/uSize.yx;
    color = drawText(uv + dist*cos(2.0*PI*(0.0*frame + xy)), pos, size, uColor) * lum;
    finalColor = mix(finalColor, color, color.a * opacity);

    gl_FragColor = finalColor;
}
