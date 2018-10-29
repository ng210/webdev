base.js
    'include': {
        writeable: false,
        enumerable: false,
        value: (path) => {
            var url = new Url(load.normalizePath(path), false).toString();
            var key = Object.keys(_modules).find( v => { return v.startsWith(url); });
            if (key == undefined) {
                var res = load(url);
                if (res instanceof Error) throw new Error('Could not load "'+url+'"!');
            }
        }
    },
    'public': {
        writeable: false,
        enumerable: false,
        value: (obj, name) => {
            var scripts = document.getElementsByTagName('script');
            var script = document.currentScript;
            var url = (script.src || script.url) + '#' + name;
            window[name] = _modules[url] = obj;
        }
    },


main.js
window.onresize = function(e) {
		var cvs = document.querySelector('#cvs');
		var cnt = document.querySelector('#cvs-container');
		width = cnt.clientWidth;
		height = cnt.clientHeight;
		con.style.width = width + 'px';
		webGL.resize(gl, width, height);
}


webgl.js
		resize: function(gl, width, height) {
			
			if (gl.canvas.width  != width || gl.canvas.height != height) {
				gl.canvas.width  = width;
				gl.canvas.height = height;
				gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
			}
		},
   
   
