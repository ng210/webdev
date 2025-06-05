#version 300 es
precision highp float;
precision highp isampler2D;

in vec2 v_texcoord;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_size;

out vec4 color;

float pointToSegmentDistance(vec2 p, vec2 a, vec2 b) {
    vec2 ab = b - a;
    vec2 ap = p - a;
    float t = clamp(dot(ap, ab) / dot(ab, ab), 0.0, 1.0);
    vec2 closest = a + t * ab;
    return length(p - closest);
}

vec4 pointOsc(vec2 uv, float ix, vec2 size) {
    vec2 texcoor = vec2(mod(ix, size.x)/size.x, ix/size.x/size.y);
    vec2 smp = 0.3 * texture(u_texture, texcoor).xy + vec2(0.25, 0.75);
    color = (1.-step(.001, abs(uv.y-smp.x))) * vec4(.2,.8,.3, 1.);
    color += (1.-step(.001, abs(uv.y-smp.y))) * vec4(.8,.3,.2, 1.);
    return color;
}

vec4 lineOsc(vec2 uv_, float ix_, vec2 size) {
    vec2 uv1 = gl_FragCoord.xy/u_resolution;
    vec2 uv2 = (gl_FragCoord.xy+vec2(1.0, 0.0))/u_resolution;
    float ix1 = uv1.x * u_size;
    vec2 texcoor1 = vec2(mod(ix1, size.x)/size.x, ix1/size.x/size.y);
    vec2 smp1 = 0.3 * texture(u_texture, texcoor1).xy + vec2(0.25, 0.75);

    float ix2 = uv2.x * u_size;
    vec2 texcoor2 = vec2(mod(ix2, size.x)/size.x, ix2/size.x/size.y);
    vec2 smp2 = 0.3 * texture(u_texture, texcoor2).xy + vec2(0.25, 0.75);

    vec2 p11 = vec2(uv1.x, smp1.x);
    vec2 p12 = vec2(uv2.x, smp2.x);

    float lineWidth = 0.002;
    float d = pointToSegmentDistance(uv1, p11, p12);
    float alpha = smoothstep(lineWidth, lineWidth * 0.5, d);
    color = vec4(alpha*vec3(.8,.3,.2), 1.);

    vec2 p21 = vec2(uv1.x, smp1.y);
    vec2 p22 = vec2(uv2.x, smp2.y);
    d = pointToSegmentDistance(uv1, p21, p22);
    alpha = smoothstep(lineWidth, lineWidth * 0.5, d);
    color += vec4(alpha*vec3(.2,.8,.3), 1.);

    return color;
}


void main(void) {
    vec2 uv = gl_FragCoord.xy/u_resolution;
    vec2 size = vec2(textureSize(u_texture, 0));
    float ix = uv.x * u_size;
    //color = pointOsc(uv, ix, size);
    color = lineOsc(uv, ix, size);
}
