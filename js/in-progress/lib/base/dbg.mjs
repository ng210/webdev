import { cons } from './cons.mjs';

const dbg = {
	con: null,
	clicked: false,
	init: function init(lbl) {
		if (typeof window !== 'undefined') {
			// browser
			try {
				// setup console
				cons.init(lbl);
				var con = document.getElementById(lbl);
				con.isMouseOver = false;
				con.isClicked = false;
				con.style.opacity = 0.2;
				con.style.zIndex = 100;

				con.onMouseEvent = function onMouseEvent(e) {
					var node = e.target;
					while (node) {
						if (node == dbg.con) {
							switch (e.type) {
								case 'mouseover':
									if (!node.isClicked) node.style.opacity = 0.5; break;
								case 'mouseout':
									if (!node.isClicked) node.style.opacity = 0.2; break;
								case 'click':
									node.style.opacity = 0.75; node.isClicked = true; break;
							}
							break;
						}
						node = node.parentNode;
					}
					if (!node && e.type == 'click') {
						dbg.con.isClicked = false;
						dbg.con.style.opacity = 0.2;
					}
				};

				con.addEventListener('mouseover', con.onMouseEvent);
				con.addEventListener('mouseout', con.onMouseEvent);
				document.addEventListener('click', con.onMouseEvent);
				this.con = con;

				this.pr = function pr(txt, tag) {
					tag = tag || 'span';
					if (this.con != null) {
						var el = document.createElement(tag);
						el.innerHTML += txt || '';
						this.con.appendChild(el);
					} else {
						console.debug(txt);
					}
				};
				//this.con.style.width = window.clientWidth;
			} catch (error) {
				console.log(error)
				dbg.prln(error.message + '\n' + error.stack);
			}
		} else if (typeof self !== 'undefined') {
			// worker
			this.pr = function pr(txt, tag) {
				tag = tag || 'span';
				self.postMessage({'code':'dbg', 'id':self.messageId++, 'body':`<small>worker</small>: + <${tag}>${txt}</${tag}>`});
			};
		} else {
			// other (nodejs)
			this.pr = function pr(txt, tag) {
				console.log(txt.replace(/<br\/>/g, "\n"));
			};
		}
	},
	prln: function prln(txt, tag) {
		this.pr(txt.toString().replace(/\n/g, "<br/>") + '<br/>', tag);
	},
	measure: function measure(fn, count) {
		if (isNaN(count) || count < 0) count = 1;
		var ti = new Date().getTime();
		for (var i=0; i<count; i++) {
			fn();
		}
		ti = new Date().getTime() - ti;
		return ti/count;
	},
	breakOn: function breakOn(obj, property, onread, onwrite) {
		// call handler if obj[property] is read or written
		var oldGetter = null, oldSetter = null;
		var o = obj;
		var desc = null;
		while (o) {
			desc = Object.getOwnPropertyDescriptor(o, property);
			if (desc) break;
			o = o.__proto__;
		}
		if (!desc) {
			console.warn(`Invalid property '${property}'!`);
			return;
		}
		if (desc.value != undefined) {
			o.__value = desc.value;
			delete desc.value;
			desc.get = onread ? function() { debugger; return this.__value; } : function() { return this.__value; };
			if (desc.writable) {
				desc.set = onwrite ? function(v) { debugger; return this.__value = v; } : function(v) { return this.__value = v; };
			}
			delete desc.writable;
		} else {
			if (onread) {
				obj.__oldGetter = desc.get || function() { return; };
				desc.get = function() { debugger; return this.__oldGetter.call(this); };
			}
			if (onwrite) {
				obj.__oldSetter = desc.set || function(v) { return; };
				desc.set = function(v) { debugger; this.__oldSetter.call(this, v); };
			}
		}
		Object.defineProperty(obj, property, desc);
	},
	prst: function prst(limit) {
		limit = limit || 100;
		var e = new Error();
		var lines = e.stack.split('\n');
		limit += 2;
		for (var i=2; i<limit && i<lines.length; i++) {
			var m = lines[i].match(/^\s+at\s([^\s]+).+$/);
			var line = m[1].replace(/[<>]/g, '');
			dbg.pr(`${line}; `);
		}
		dbg.prln('');
	}
};

export { dbg };
