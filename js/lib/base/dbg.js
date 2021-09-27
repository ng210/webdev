include('/lib/base/html.js');
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
				document.addEventListener('mouseover', Dbg.con_onmouseover);
			};
			Dbg.pr = function pr(txt, tag) {
				tag = tag || 'span';
				if (this.con != null) {
					var el = document.createElement(tag);
					el.innerHTML += txt || '';
					this.con.appendChild(el);
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
	
		} catch (error) {
			alert(error.message + '\n' + error.stack);
		}
	} else {
		Dbg.pr = function pr(txt, tag) {
			tag = tag || 'span';
			self.postMessage({'code':'dbg', 'id':self.messageId++, 'body':`<small>worker</small>: + <${tag}>${txt}</${tag}>`});
		};
	}
	Dbg.prln = function prln(txt, tag) {
		this.pr(txt.toString().replace(/\n/g, "<br/>") + '<br/>', tag);
	};
	Dbg.measure = function measure(fn, count) {
		if (isNaN(count) || count < 0) count = 1;
		var ti = new Date().getTime();
		for (var i=0; i<count; i++) {
			fn();
		}
		ti = new Date().getTime() - ti;
		return ti/count;
	};
	Dbg.breakOn = function breakOn(obj, property, onread, onwrite) {
		// call handler if obj[property] is read or written
	};

	publish(Dbg, 'Dbg');
})();
