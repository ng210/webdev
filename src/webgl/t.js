var timer = null;
var ctx = null;
var n = 36;
var scale = 1;
var vertexData = [];
var width = 0;
var height = 0;

window.onload = e => {
	try {
		var cvs = document.querySelector('#cvs');
		var cnt = document.querySelector('#cvs-container');
		ctx = cvs.getContext('2d');
		
		width = cvs.width = cnt.clientWidth;
		height = cvs.height = cnt.clientHeight;
		scale = Math.min(width, height)/4;
	
		// create sphere
		for (var di=0; di<=n; di++) {
			var d = di*Math.PI/n;
			var y = Math.cos(d);
			var r = Math.sin(d);
			for (var ai=0; ai<2*n; ai++) {
				var a = ai*Math.PI/n;
				var x = r*Math.cos(a);
				var z = r*Math.sin(a);
				vertexData.push(x, y, z);
			}
		}
		
		render(0);

	} catch (error) {
		alert(error.stack);
	}
}

function render(f) {
	clearTimeout(timer);

	ctx.fillStyle = '#201040';
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = '#a0e060';
	ctx.strokeStyle = '#a0e060';
	ctx.lineWidth = 2;

	var disp = (4 - ctx.lineWidth)/2;
	var xy = [0, 0], j = 0;
	var fi = f % 50;
	for (var i=0; i<vertexData.length; i+=3) {
		var cx = vertexData[i+0];
		var cy = vertexData[i+1];
		var cz = vertexData[i+2];
		// orthogonal projection
		var x = scale*(cx) + width/2;
		var y = scale*(cy+Math.tan(fi*Math.PI/180)*cz) + height/2;
		ctx.fillRect(x-disp, y-disp, 4, 4);
		j++;
		if (j == 1) {
			ctx.beginPath();
			xy[0] = x;
			xy[1] = y;
			ctx.moveTo(x, y);
		} else {
			ctx.lineTo(x, y);
			ctx.moveTo(x, y);
			if (j == 2*n) {
				ctx.lineTo(xy[0], xy[1]);
				ctx.stroke();
				j = 0;
			}
		}
	}
	timer = setTimeout(render, 100, ++f);
}
