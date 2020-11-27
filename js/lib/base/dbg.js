(function() {
	var Dbg = {};
	if (!ISWORKER) {
		try {
			Dbg.con = null;
			Dbg.clicked = false;
			Dbg.init = function init(lbl) {
				this.con = document.getElementById(lbl);
				this.con.onmouseout = e => Dbg.mouseOver = false;
				this.con.onclick = e => {
					this.clicked = true;
					this.con.style.opacity = 0.75;
				};
				this.con.style.opacity = 0.2;
				this.con.style.zIndex = 100;
				//this.con.style.width = window.clientWidth;
			};
			Dbg.pr = function pr(txt) {
				if (this.con != null) {
					var span = document.createElement('span');
					span.innerHTML += txt || '';
					this.con.appendChild(span);
				} else {
					console.debug(txt);
				}
			};
			Dbg.con_onmouseover = function con_onmouseover(e) {
				var node = e.target;
				while (node) {
					if (node == Dbg.con) {
						Dbg.mouseOver = true;
					}
					node = node.parentNode;
				}
				Dbg.con.style.opacity = Dbg.mouseOver ? (Dbg.clicked ? 0.75 : 0.5) : 0.2;
			};
			document.addEventListener('mouseover', Dbg.con_onmouseover);
	
		} catch (error) {
			alert(error.message + '\n' + error.stack);
		}
	} else {
		Dbg.pr = function pr(txt) {
			self.postMessage({'code':'dbg', 'id':self.messageId++, 'body':'<small>worker</small>:' + txt});
		};
	}
	Dbg.prln = function prln(txt) {
		this.pr(txt.toString().replace(/\n/g, "<br/>") + '<br/>');
	};
	Dbg.measure = function measure(fn, lbl) {
		var ti = new Date().getTime();
		for (var i=0; i<10000; i++) {
			fn();
		}
		ti = new Date().getTime() - ti;
		this.prln(lbl + ': ' + ti);
	}

	publish(Dbg, 'Dbg');
})();
