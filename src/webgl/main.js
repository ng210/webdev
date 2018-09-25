var con = null;
function prln(txt) {
	pr(txt + '<br/>');
}
function pr(txt) {
	con.innerHTML += txt || '';
}

function measure(fn, lbl) {
	var ti = new Date().getTime();
	for (var i=0; i<10000; i++) {
		fn();
	}
	ti = new Date().getTime() - ti;
	prln(lbl + ': ' + ti);
}

window.onload=()=>{

	try {

		con = document.getElementById('dbgConsoleBody');
		
		var m1 = M4.lookAt(new V3(0, 1, -5), new V3(0, 0, 0), new V3(0, 1, 0));
		var m2 = M4.fps(new V3(0, 1, -5), Math.PI/4, Math.PI/4);
/*
			1.0, 2.0, 4.0, 8.0,
			1.0, 3.0, 6.0,12.0,
			1.0, 4.0, 8.0,16.0,
			1.0, 5.0,10.0,20.0 ]);
*/			
		prln('m1: ' + m1);
		prln('m2: ' + m2);

		measure(()=>m2.mul(m2), 'mul');

		var m3 = m2.mul(m2);
		prln('m2*m2 = ' + m3);

	} catch (err) {
		prln(err.message);
		prln(err.stack);
	}
};
