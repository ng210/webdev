include('frmwrk/load.js');

var module = module || {};
function require(path) {
    if (module[path] == undefined) {
        var data = load(path);
        var script = document.createElement('script');
        script.innerHTML = data.replace('module.exports', 'module["' + path + '"]');
        document.head.appendChild(script);
        document.head.removeChild(script);
        delete script;            
    }
    return module[path];
}

