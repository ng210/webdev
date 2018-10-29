(function() {
	try {
	var Dbg = {
		con: null,
		clicked: false,
		init: function(lbl, width) {
			this.con = document.getElementById(lbl);
			this.con.onmouseover = e => this.con.style.opacity = this.clicked ? 0.5 : 0.2;
			this.con.onmouseout = e => { this.clicked = false; this.con.style.opacity = 0.01; }
			this.con.onclick = e => { this.clicked = true; this.con.style.opacity = 0.5; };
			this.con.style.opacity = 0.02;
			this.con.style.zIndex = 100;
			this.con.style.width = width + 'px';
		},
		prln: function(txt) {
			this.pr(txt + '<br/>');
		},
		pr: function(txt) {
			this.con.innerHTML += txt || '';
		},
		measure: function(fn, lbl) {
			var ti = new Date().getTime();
			for (var i=0; i<10000; i++) {
				fn();
			}
			ti = new Date().getTime() - ti;
			this.prln(lbl + ': ' + ti);
		}
	};
	public(Dbg, 'Dbg');
	
	} catch (error) {
		alert(error.message + '\n' + error.stack);
	}

})();
