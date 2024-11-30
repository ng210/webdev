var Path = null;
var CurrentDir = '';

if (typeof self === 'undefined') {
    CurrentDir = process.cwd();
    Path = await import('node:path');
} else {
    Path = {
        basename: function basename(path, suffix) {
            var obj = Path.parse(path);
            return suffix && obj.base.endsWith(suffix) ? obj.base.slice(0, -suffix.length) : obj.base;
        },

        delimiter: ';',

        dirname: function dirname(path) {
            var obj = Path.parse(path);
            return obj.dir.length > 0 ? obj.dir : '.';
        },

        extname: function extname(path) {
            var obj = Path.parse(path);
            return obj.ext;
        },

        format: function format(pathObj) {
            var dir = pathObj.dir != '' ? pathObj.dir + Path.sep : pathObj.root;
            var ext = pathObj.ext;
            if (ext && !ext.startsWith('.')) ext = '.' + ext;
            var file = pathObj.base || pathObj.name + ext;
            return dir + file;

            // var dir = Path.normalize(pathObj.dir);
            // if (dir.endsWith(Path.sep)) dir = dir.slice(0, -1);
            // var sb = [dir];
            // if (pathObj.base) {
            //     sb.push(pathObj.base);
            // } else {
            //     var name = Path.normalize(pathObj.name || '');
            //     var ext = pathObj.ext;
            //     if (ext) {
            //         name += ext.startsWith('.') ? ext : '.' + ext;
            //     }
            //     if (name.startsWith(Path.sep)) name = name.slice(1);
            //     sb.push(name);
            // }
            // var res = sb.join(Path.sep);
            // return pathObj.dir == '' ? pathObj.root + res : res;
        },

        isAbsolute: function isAbsolute(path) {
            path = Path.normalize(path);
            return path.startsWith(Path.sep) || path.match(/^[a-zA-Z]:/);
        },

        join: function join() {
            var args = [];
            for (var i in arguments) args.push(arguments[i]);
            var res = Path.normalize(args.join(Path.sep));
            return res.length > 0 ? res : '.';
        },

        normalize: function normalize(path) {
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
        },

        parse: function parse(path) {
            if (typeof path !== 'string') throw new Error('Received parameter is not of type string!');
            var root = '', dir = '', base = '', ext = '', name = '';
            if (path.length > 0) {
                var ix = path.length - 1;
                while (ix >= 0) {
                    var c = path.charAt(ix);
                    if (c != '\\' && c != '/') break;
                    ix--;
                }
                if (ix != -1) {
                    base = path.substring(0, ix + 1);
                } else {
                    base = '/';
                }

                var ix1 = base.lastIndexOf('\\');
                var ix2 = base.lastIndexOf('/');
                ix = ix1 > ix2 ? ix1 : ix2;
                if (base.startsWith('\\') || base.startsWith('/')) root = base.charAt(0);
                dir = base.substring(0, ix || 1);
                base = base.substring(ix + 1);
                if (base.match(/^[a-zA-Z]:/)) {
                    dir = base.substring(0, 2);
                    base = base.substring(2); 
                }

                ix = base.lastIndexOf('.');
                if (ix > 0) {
                    ext = base.substring(ix);
                    name = base.substring(0, ix);
                } else {
                    name = base;
                }

                if (dir.match(/^[a-zA-Z]:/)) {
                    var c = dir.charAt(2);
                    root = dir.substring(0, c == '\\' || c == '/' ? 3 : 2);
                }
            }

            return { root: root, dir: dir, base: base, ext: ext, name: name };
        },
        
        //posix: function posix { },

        relative: function relative(from, to) {
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
                    //res.push(fp[ti]);
                }
                for (;ti<tp.length;ti++) res.push(tp[ti]);
            } else {
                res = tp;
                res.unshift(td);
            }
            return res.join(Path.sep);
        },

        resolve: function resolve() {
            var paths = [];
            var res = [];
            for (var i in arguments) {
                if (arguments[i] != undefined) paths.push(Path.normalize(arguments[i]));
            }

            for (var pi=paths.length-1; pi>=0; pi--) {
                var path = paths[pi];
                if (Path.isAbsolute(path)) {
                    while (pi < paths.length) {
                        path = paths[pi];
                        if (path.length > 0) res.push(paths[pi]);
                        pi++;
                    }
                    break;
                }
            }
            if (res.length == 0) {
                res.push(CurrentDir);
                for (var pi=0; pi<paths.length; pi++) {
                    if (paths[pi].length > 0) res.push(paths[pi]);
                }
            }

            return Path.normalize(res.join(Path.sep));
        },

        sep: '/',
        
        toNamespacedPath: function toNamespacedPath(path) {

        },

        //win32: function win32 {},
    };
    CurrentDir = typeof window !== 'undefined' ? '/' : '???';
};

export { Path, CurrentDir };