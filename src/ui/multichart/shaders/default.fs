precision mediump float;

uniform vec2 uSize;
uniform vec2 uUnit;
uniform vec3 uGridColor;
uniform vec2 uOffset;
uniform vec2 uZoom;
uniform float uFrame;
uniform vec2 uMousePos;
uniform int uPointCount;
uniform vec2 uDataPoints[100];
uniform vec2 uRange;

#define PI 3.1415926535897932384626433832795
#define SQRT2 1.4142135623730950488016887242097

bool hasDataPoint(vec2 pos) {
	vec2 start = floor(pos);
	for (int i=0; i<=100; i++) {
		if (i == uPointCount) break;
		vec2 dataPoint = uDataPoints[i];
        vec2 point = floor(dataPoint* vec2(1.0, 1.0) + uOffset);
         float res = length(step(point, start) * step(-point, -start));
         if (res >= SQRT2) return true;
	}
   return false;
}


void main() {
	vec3 col = vec3(0.0);
   	vec2 coors = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
   	vec2 pos = coors/uUnit;
   	vec2 m = mod(coors, uUnit);
   	float dist = mix(1.0, smoothstep(0.9, 0.1, distance(uSize/2.0, coors)/float(uSize.x)), 1.5);
   	if (!hasDataPoint(pos - uOffset)) {
		float f = (1.0 - 0.8*step(uRange.x+1.0, pos.x));
		float g = step(uUnit.x-(0.5 + 1.5*step(3.0, mod(pos.x, 4.0))), m.x);
		float h = floor(mod(pos.y, 12.0));
		float q = uUnit.y;
		if (h == 1.0 || h == 3.0 || h == 6.0 || h == 8.0 || h == 10.0) {
			q = 0.0;
		}
		g += step(uUnit.y-q, m.y);
		vec3 gridColor = uGridColor;
		if (floor(mod(pos.y/12.0, 2.0)) == 0.0) {
			gridColor *= 2.0;
		}
		col = 0.8*f*g*gridColor;
   	} else {
      	col = vec3(1.0, 0.95, 0.5)*(1.0 - 0.4*length(step(1.0, m)) + 0.4*length(step(1.0, uUnit-m)));
   	}

	// cursor
   	vec2 start = floor(uMousePos/uUnit) * uUnit;
   	vec2 diff = coors - start;
   	vec2 select = step(0.0, diff) * step(-uUnit, -diff);
   	col += vec3(0.1, 0.1, 0.14) * select.x;
   	col += vec3(0.1, 0.14, 0.1) * select.y;

	col *= dist;
   	gl_FragColor = vec4(col, 1.0);
}
