include('frmwrk/load.js');

var module = module || {};
function require(path) {
    if (module[path] == undefined) {
        var data = load({url:path,contentType:'text/plain'});
        if (data) {
            var script = document.createElement('script');
            script.innerHTML = data.replace('module.exports', 'module["' + path + '"]');
            document.head.appendChild(script);
            document.head.removeChild(script);
            delete script;
        } else {
            throw new Error('Module not found ' + path);
        }
    }
    return module[path];
}

function parseElement(el) {
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
};