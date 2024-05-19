function getBezierY(x, px, transform) {
	var py = 1 - px;
	var ax = 1 - 2 * px, ay = 1 - 2 * py;
	var bx = 2 * px, by = 2 * py;
    var r = (-bx + Math.sqrt(bx * bx + 4.0 * ax * x)) / (2.0 * ax);
    var y = r * r * ay + by * r;
    return transform(y, 0);
}

function main() {
    var args = process.argv;
    if (args.length > 1) {
        console.log('\n');
        for (var ai=2; ai<args.length; ai++) {
            var freq = args[ai];
            var fs = 48000;

            var output = 0;
            var step = 0.1;
            var fi = 0.0;
            while (step > 0.0000001) {
                //console.log(` * fi=${fi}, step=${step}`);
                do {
                    var c1 = getBezierY(fi, 0.85, y => Math.PI * (0.0002 + y * 0.9998) * fs);
                    var c2 = getBezierY(fi + step, 0.85, y => Math.PI * (0.0002 + y * 0.9998) * fs);
                    if (c1 < freq && c2 > freq) {
                        output = c1;
                        break;
                    }
                    fi += step;
                } while (fi <= 1.0);
                step /= 10;
                var err = Math.abs(freq - output);
                if (err < 10) break;
            }
            var input = Math.round(fi*255);
            output = getBezierY(input/255, 0.85, y => Math.PI * (0.0002 + y * 0.9998) * fs);
            console.log(`## input=${input}(${fi.toPrecision(4)}), output=${output.toPrecision(4)}, err=${Math.abs(output - freq)}`);
        }
    }
}

// 270, 2290, 3010
main();