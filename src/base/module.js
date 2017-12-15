include('base/globals.js');
include('base/load.js');
(function(){
	Object.defineProperties(window.top, {
		require: {
			enumerable: false,
			configurable: false,
			writable: false,
			value: function(path) {
				var urlInfo = new load.UrlObject(path);
				var p = urlInfo.path;
				if (module[p] == undefined) {
					var data = load({url:p,contentType:'text/plain'});
					if (data) {
						var script = document.createElement('script');
						script.innerHTML = data.replace('module.exports', 'module["' + p + '"]');
						document.head.appendChild(script);
						document.head.removeChild(script);
						delete script;
					} else {
						throw new Error('Module not found ' + p);
					}
				}
				return module[p];
			},
		},
		parseElement: {
			enumerable: false,
			configurable: false,
			writable: false,
			value: function(el) {
				// if ELEMENT_NODE and hasChildren or hasAttributes
				if (el.nodeType == 1 && (el.children.length > 0 || el.attributes.length > 0)) {
					var obj = {};
					for (var i=0; i<el.children.length; i++) {
						var child = el.children[i];
						var id = child.localName;
						// Recursive call for each child
						var value = parseElement(child);
						value.nodeName_ = id;
						if (value != '') {
							// object with the same id exists?
							if (obj[id] !== undefined) {
								// is obj not an array?
								if (!Array.isArray(obj[id])) {
									// convert it into an array
									var arr = obj[id];
									obj[id] = [arr];
								}
								// push value into array
								obj[id].push(value);
							} else {
								obj[id] = value;
							}
						}
					}
					for (var a=0; a<el.attributes.length; a++) {
						obj[el.attributes[a].nodeName] = el.attributes[a].value.toString();
					}
					return obj;
				}
				return el.textContent.toString();
			}
		}
	});
})();