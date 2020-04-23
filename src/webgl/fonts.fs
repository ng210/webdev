#define MAXLENGTH 255

precision mediump float;

uniform float uFrame;
uniform vec2 uSize;

uniform vec3 uText[MAXLENGTH];
uniform int uTextLength;
uniform vec4 uColor;

uniform float uFontHeight;
//uniform vec3 uFontData[64];
uniform sampler2D uFontTexture;

float inRect(vec2 v, vec2 topRight, vec2 bottomLeft) {
    vec2 s = step(bottomLeft, v) - step(topRight, v);
    return s.x * s.y;   
}

vec4 drawText(vec2 pos) {
    vec4 col = vec4(0.0);
    if (inRect(gl_FragCoord.xy, pos, pos + vec2(200.0, uFontHeight)) == 1.0) {
        vec2 textCoord = gl_FragCoord.xy - pos;

        for (int i=0; i<MAXLENGTH; i++) {
		    if (i == uTextLength) break;
            if (textCoord.x <= uText[i].z) {
                // textCoord.x -= uText[i].z;
                // textCoord += uText[i].xy;
                col = vec4(float(i)/float(uTextLength)) * texture2D(uFontTexture, vec2(0.1, 0.0));
                col.a = 1.0;
                break;
            }
        }
    }
    return col;
}

void main()
{
    vec2 uv = gl_FragCoord.xy/uSize;

    vec4 col = drawText(vec2(100.0, 100.0));
    if (col.a != 0.0) {
        gl_FragColor = col;
    } else {
        gl_FragColor = vec4(0.05, 0.1, 0.2, 1.0);
    }    
}
