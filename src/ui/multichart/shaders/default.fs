precision highp float;

#define PI 3.1415926535897932384626433832795
#define SQRT2 1.4142135623730950488016887242097
#define MAXPOINT 100

#define MODE 1

uniform vec2 uSize;
uniform vec2 uUnit;
uniform vec2 uOffset;
uniform vec2 uZoom;
uniform vec3 uGridColor;
uniform vec3 uColor;
uniform float uFrame;
uniform vec2 uMousePos;
uniform vec2 uDataPoints[MAXPOINT];
uniform int uPointCount;
uniform float uMaxX;
uniform bool uArea;
uniform int uRenderMode;
uniform float uLineWidth;

float rand(vec2 co){
   return fract(sin(0.001*uFrame*dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
float vignette() {
	return mix(1.0, smoothstep(0.6, 0.1, distance(uSize/2.0, gl_FragCoord.xy)/uSize.x), 1.6);
}

float greater(float x, float a) {
	return 1.0 - step(-a, -x);
}

float less(float x, float a) {
	return 1.0 - step(a, x);
}

float greaterEq(float x, float a) {
	return step(a, x);
}

float lessEq(float x, float a) {
	return step(-a, -x);
}

float between(float a, float b, float x) {
	return greaterEq(x, a)*lessEq(x, b);
}

float between(vec2 a, vec2 b, vec2 v) {
	return between(a.x, b.x, v.x) * between(a.y, b.y, v.y);
}

float getColorForBar(vec2 pos) {
    vec2 uc = floor(pos/uUnit);
	for (int i=0; i<MAXPOINT; i++) {
		if (i == uPointCount) break;
		vec2 p0 = uDataPoints[i];
		if (distance(p0, uc) < 1.0) return 0.8;
	}
	return 0.0;
}

float getColorForArea(vec2 pos) {
	vec2 uc = floor(pos/uUnit);
	vec2 p0 = uDataPoints[0];
	if (uPointCount > 0) {
		for (int i=1; i<MAXPOINT; i++) {
			if (i == uPointCount) break;
			vec2 p1 = uDataPoints[i];
			if (p0.x <= uc.x && uc.x < p1.x && p0.y >= uc.y) return 0.8;
			p0 = p1;
		}
		if (p0.x <= uc.x && p0.y >= uc.y) return 0.8;
	}
	return 0.0;
}

float getColorForDot(vec2 pos) {
	vec2 uc = (pos - 0.5*(uUnit + vec2(1.0)))/uUnit;
	vec2 d = 0.5*(uUnit - vec2(5.0))/uUnit;
	for (int i=0; i<MAXPOINT; i++) {
		if (i == uPointCount) break;
		vec2 p0 = abs(uDataPoints[i] - uc);
		if (p0.x < d.x && p0.y < d.y) return 0.8;
	}
   return 0.0;
}

float getColorForLine(vec2 pos) {
	if (uPointCount > 0) {
		vec2 uc = (pos - 0.5*(uUnit + vec2(1.0)))/uUnit;
		vec2 d = 0.5*(uUnit - vec2(5.0))/uUnit;
		vec2 p0 = uDataPoints[0];
		if (abs(p0.x - uc.x) < d.x && abs(p0.y - uc.y) < d.y) return 0.8;
		bool result = false;
		for (int i=1; i<MAXPOINT; i++) {
			if (i == uPointCount) break;
			vec2 p1 = uDataPoints[i];
			if (abs(p1.x - uc.x) < d.x && abs(p1.y - uc.y) < d.y) return 0.8;
			vec2 delta = p1 - p0;
			float y1 = min(p0.y, p1.y);
			float y2 = max(p0.y, p1.y);
			if (p0.x - uLineWidth <= uc.x && uc.x <= p1.x + uLineWidth &&
				y1 - uLineWidth <= uc.y && uc.y <= y2 + uLineWidth &&
				abs(delta.y*uc.x - delta.x*uc.y + p1.x*p0.y - p1.y*p0.x)/length(delta) <= uLineWidth) return 0.5;
			p0 = p1;
		}
	}
   return 0.0;
}

void main() {
	vec3 col = 0.25*uGridColor;
    vec2 world = gl_FragCoord.xy + uOffset;
	vec2 grid = mod(world, uUnit);
	if (grid.x < 1.0 || grid.y < 1.0) col = uGridColor;
	grid = mod(world, vec2(8.0, 5.0)*uUnit);
	if (grid.x < 1.0 || grid.y < 1.0) col = 1.6*uGridColor;
    if (world.x >= 0.0 && world.x <= float(uMaxX + 1.0)*uUnit.x) {
		float f = 0.0;
		if (uRenderMode == 0) {
			f = getColorForBar(world);
		} else if (uRenderMode == 1) {
			f = getColorForArea(world);
		} else if (uRenderMode == 2) {
			f = getColorForDot(world);
		} else if (uRenderMode == 3) {
			f = getColorForLine(world);
		}
		col = mix(col, uColor, f+0.08);
	}
   	vec2 start = floor((uMousePos + uOffset)/uUnit) * uUnit;
   	vec2 diff = world - start;
	vec2 select = step(0.0, diff) * step(-uUnit, -diff);
   	col += vec3(0.1, 0.1, 0.14) * select.x;
   	col += vec3(0.1, 0.14, 0.1) * select.y;
	//col *= 0.8 + 0.5*rand(gl_FragCoord.xy)*vignette();
    gl_FragColor.rgb = col;
}
