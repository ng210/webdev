var Path = null;
var CurrentDir = '';

if (typeof self === 'undefined') {
    CurrentDir = process.cwd();
    Path = await import('node:path');
} else {
    Path = class Path {
        static #removeTrailingSeparators(path) {
            var ix = path.length - 1;
            while (path.charAt(ix) == Path.sep) ix--;
            if (ix < 0) ix++;
            return path.substring(0, ix + 1);
        }

        static #getLastPathSeparator(path) {
            var ix1 = path.lastIndexOf('\\');
            var ix2 = path.lastIndexOf('/');
            return ix1 > ix2 ? ix1 : ix2;
        }

        static basename(path, suffix) {
            var base = Path.parse(path).base;
            return suffix && base.endsWith(suffix) && base.length > suffix.length ? base.slice(0, -suffix.length) : base;
        }

        static delimiter = ';';

        static dirname(path) {
            var dir = Path.parse(path).dir;
            return dir == '' ? '.' : dir;
        }

        static extname(path) {
            return Path.parse(path).ext;
        }

        static format(pathObj) {
            // dir || root
            var dir = pathObj.root;
            if (pathObj.dir) dir = `${pathObj.dir}${Path.sep}`;
            // base || name + ext
            var ext = pathObj.ext;
            if (ext && !ext.startsWith('.')) ext = '.' + ext;
            var file = pathObj.base || `${pathObj.name}${ext}`;
            return `${dir}${file}`;
        }

        static isAbsolute(path) {
            //path = Path.normalize(path);
            return path.startsWith(Path.sep) || /^[a-zA-Z]:/.test(path);
        }

        static join() {
            var args = [];
            for (var i in arguments) args.push(arguments[i]);
            var res = Path.normalize(args.join(Path.sep));
            return res.length > 0 ? res : '.';
        }

        static normalize(path) {
            if (typeof path !== 'string') throw new TypeError('Received parameter is not of type string!');
            var oldSep = Path.sep == '/' ? '\\' : '/';
            path = path.replaceAll(oldSep, Path.sep);
            var parts = path.split(Path.sep);
            var res = [];
            for (var pi=0; pi<parts.length; pi++) {
                var p = parts[pi];
                if (p == '' && pi > 0 && pi < parts.length-1) continue;
                if (p == '.') continue;
                if (p == '..' && res.length > 0) {
                    res.pop();
                    continue;
                }
                res.push(p);
            }
            if (res.length == 0) res.push('.');
            return res.join(Path.sep);
        }

        static parse(path) {
            path = Path.#removeTrailingSeparators(path);
            // extract root
            var root = '';
            var m = path.match(/^[A-Za-z]:[\\/]?/);   // windows
            if (m) {
                root = m[0];
                path = path.substring(root.length);
            } else {
                m = path.match(/^[\\/]/);             // unix
                if (m) {
                    root = m[0];
                    path = path.substring(root.length);
                }
            }

            // extract dir
            var i = path.length - 1;
            while (i != -1) {
                var ch = path.charAt(i);
                if (ch == '\\' || ch == '/') {
                    break;
                }
                i--;
            }
            var dir = root + path.substring(0, i);

            // extract base, name, ext
            var base = i != -1 ? path.substring(i + 1) : path;
            var name = base, ext = '';
            if (base != '..') {
                var ix = base.lastIndexOf(".");
                if (ix > 0) {
                    ext = base.substring(ix);
                    name = base.substring(0, ix)
                } else {
                    ext = '';
                    name = base;
                }
            }    
            return { root, dir, base, name, ext };

        }
        
        //static posix { }

        static relative(from, to) {
            var fp = Path.normalize(from).split(Path.sep);
            var tp = Path.normalize(to).split(Path.sep);
            var fd = fp[0].match(/[a-zA-Z]:/) ? fp.shift() : '';
            var td = tp[0].match(/[a-zA-Z]:/) ? tp.shift() : '';
            if (fd.toUpperCase().localeCompare(td.toUpperCase()) == 0) {
                var res = [];
                var ti = 0;
                for (var ti=0; ti<fp.length; ti++) {
                    if (fp[ti] != tp[ti]) {
                        for (var fi=ti;fi<fp.length;fi++) res.unshift('..');
                        break;
                    }
                }
                for (;ti<tp.length;ti++) res.push(tp[ti]);
            } else {
                res = tp;
                res.unshift(td);
            }
            return res.join(Path.sep);
        }

        static resolve() {
            var paths = [];
            for (var i in arguments) {
                if (arguments[i] != undefined) paths.push(Path.normalize(arguments[i]));
            }

            var root = '';
            var res = [];
            var isAbsolute = false;
            while (paths.length > 0) {
                var path = paths.pop();
                if (root == '') {
                    var m = path.match(/^[A-Za-z]:/);
                    if (m) root = m[0];
                    path = path.substring(root.length);
                }
                if (!isAbsolute) {
                    res.unshift(path);
                    isAbsolute = Path.isAbsolute(path);
                }
                if (isAbsolute && root != '') {
                    break;
                }
            }

            if (!isAbsolute) {
                res.push(CurrentDir);
            }

            root = root || Path.parse(CurrentDir).root;
            res.unshift(root);

            return Path.#removeTrailingSeparators(Path.normalize(res.join(Path.sep)));
        }

        static sep = '/';
        
        // static toNamespacedPath(path) {

        // }

        // //static win32 {}
    };

    CurrentDir = Path.normalize(document.location.href);
};

export { Path, CurrentDir };