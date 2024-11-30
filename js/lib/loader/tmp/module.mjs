import { Path } from './path.mjs';
import { Url } from './url.mjs';

function Module(options) {
    this.url = options.url;
    this.node = null;
    this.includes = {};
    this.dependents = {};
    this.node = document.createElement('SCRIPT');

    this.status = Module.Status.None;
    this.error = null;
    // this.symbols = {};
//     var re = /include\('(?<src>[^']+)'\)|include\("(?<src>[^"]+)"\)/g;
//     if (!options.data) {
//         this.status = self.Module.Status.Error;
//         this.error = new Error('No data received!');
//     } else {
//         this.data = options.data.replace(re, (match, p1, p2) => {
//             var ld = p1 !== undefined ? p1 : p2 !== undefined ? p2 : null;
//             if (ld) {
//                 var url = new Url(ld);
//                 var script = document.currentScript || import.meta;
// debugger
//                 url.path = Path.resolve(url, script.src || script.url);
//                 console.log(url);
//                 //this.includes[]
//             }
//             return match;
//         });
//     }
}

Module.Status = {
    'None': 0,
    'Loading': 1,
    'Complete': 2,
    'Error': 3
};

Module.prototype.resolveIncludes = async function() {
    // replace #include '...' and trigger loading of the resource
    //var re = /include\('([^']+)'\)/g;

    // var loads = [];
    // //var mdl = this;
    // var currentPath = this.resolvedUrl.path;
    // currentPath = currentPath.substr(0, currentPath.lastIndexOf('/'));
    // this.data = this.data.replace(re, (match, p1, p2) => {
    //     if (p1 != undefined) {
    //         return `${match} // skipped`;
    //     }
    //     if (p2 != undefined) {
    //         loads.push(include(p2, currentPath));
    //         return `// ${match} // included`;
    //     }
    //     return p2;
    // });
    // // load every includes
    // var includes = await Promise.all(loads);
    // debug_('M.DEPENDS @'+this.toString()+'\n' + includes.map(x=>`-${x.toString()}`).join('\n'), 2);
    // this.includes = [];
    // for (var i=0; i<includes.length; i++) {
    //     var im = includes[i];
    //     if (im.status == Resource.ERROR) {
    //         this.error = new Error(`Could not load dependency: ${im.url}`);
    //         this.status = Resource.ERROR;
    //         return;
    //     }
    //     this.includes.push(im.url);
    // }
    // this.includes = includes.map(x=>x.url);
    // // at this point every included module should be loaded and resolved

    // this.status = Module.RESOLVED;
    // debug_('M.ADD @' + this.toString(), 3);
    // if (!ISWORKER) {
    //     this.node = document.createElement('script');
    //     this.node.url = this.url;
    //     this.node.innerHTML = this.data;
    //     document.head.appendChild(this.node);
    // } else {
    //     var lines = this.data.split('\n');
    //     for (var i=0; i<lines.length; i++) {
    //         var match = lines[i].match(/^(\s*publish\s*)\(\s*([^)]+)\s*\)\s*;?.*\r?$/);
    //         if (match != null) {
    //             var args = match[2].split(',');
    //             if (args.length < 3) args.push(' null');
    //             args.push(` '${this.url.replace(/\\/g, '\\\\')}'`);
    //             lines[i] = `${match[1]}(${args.join(',')});`;
    //             debug_('M.PUBLISH @:' + this.toString() + ' ' + args[1], 3);
    //         }
    //     }
    //     this.data = lines.join('\n');
    //     eval(this.data);
    // }
};

export { Module };