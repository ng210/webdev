import path from "path";

var data = [
    'c:\\a.html',
    'c:\a.html',
    'c:/a.html',
    'c:/a:.html',
    'c:a.html',

    '\\a.html',
    '\\\\a.html',
    '\\\\\\a.html',
    '//a.html',
    '/bar/a.html',
    'bar/a.html',
    '///a.html',

    '\\a.html',
    '\a.html',

    'c:\\foo\\a.html',
    'c:\\foo/a.html',
    'c:/foo\\a.html',
    'c:/foo/a.html',
    '..a.html',
    '..',
    '/..',
    '..a',
    '...'
];

function test1(p) {
    var exp1 = '(^[A-Za-z]:)[^\\\\/]+';
    var exp2 = '(^[A-Za-z]:.+[\\\\/])[^\\\\/]+';
    var exp3 = '(^.*[\\\\/])[^\\\\/]+';
    var m1 = p.match(`${exp1}|${exp2}|${exp3}`);
    var dir = '';
    if (m1) {
        dir = m1[1] || m1[2] || m1[3];
        if (dir.startsWith('//')) dir = dir.substring(1);
    }
    return dir;
}

function test2(p) {

    // extract root
    var root = '';
    var m = p.match(/^[A-Za-z]:[\\/]?/);   // windows
    if (m) {
        root = m[0];
        p = p.substring(root.length);
    } else {
        m = p.match(/^[\\/]/);             // unix
        if (m) {
            root = m[0];
            p = p.substring(root.length);
        }
    }

    // extract dir
    var i = p.length - 1;
    while (i != -1) {
        var ch = p.charAt(i);
        if (ch == '\\' || ch == '/') {
            break;
        }
        i--;
    }
    var dir = root + p.substring(0, i);

    // extract base, name, ext
    var base = i != -1 ? p.substring(i + 1) : p;
    var name = base, ext = '';
    if (base != '..') {
        var ix = base.lastIndexOf(".");
        ext = ix !== -1 ? base.substring(ix) : "";
        name = ix !== -1 ? base.substring(0, ix) : base;
    }    
    return { dir, root, base, name, ext };
}

function pathParse(filePath) {
    var pathSeparator = filePath.includes("/") ? "/" : "\\";

    // Extract root (Windows only)
    let root = "";
    var rootMatch = filePath.match(/^([a-zA-Z]:[\\/]|[\\/])/);
    if (rootMatch) {
        root = rootMatch[0];
        filePath = filePath.slice(root.length);
    }

    // Extract directory
    var lastSeparatorIndex = filePath.lastIndexOf(pathSeparator);
    var dir = lastSeparatorIndex !== -1 ? filePath.slice(0, lastSeparatorIndex) : "";

    // Extract base and extension
    var base = lastSeparatorIndex !== -1 ? filePath.slice(lastSeparatorIndex + 1) : filePath;
    var lastDotIndex = base.lastIndexOf(".");
    var ext = lastDotIndex !== -1 ? base.slice(lastDotIndex) : "";
    var name = lastDotIndex !== -1 ? base.slice(0, lastDotIndex) : base;

    return {
        root,
        dir: root + dir,
        base,
        ext,
        name,
    };
}


for (var d of data) {
    var dp = path.parse(d);
    var dt = test2(d);
    //var dt = pathParse(d);
    if (dt.base != dp.base || dt.name != dp.name || dt.ext != dp.ext || dt.dir != dp.dir || dt.root != dp.root) {
        console.log(`input: ${d}`);
        console.log(`parse: ${JSON.stringify(dp)}`);
        console.log(`test:  ${JSON.stringify(dt)}`);
    }
}