var Url = typeof self === 'undefined' ?
        await import('node:URL') :
        URL;
// Url.resolve = function resolve() {
//         var parts = [];
//         for (var i in arguments) {
//             if (arguments[i] != undefined) parts.push(new Url(arguments[i]));
//         }

//         var root = '';
//         var res = [];
//         var isAbsolute = false;
//         while (paths.length > 0) {
//             var path = paths.pop();
//             if (root == '') {
//                 var m = path.match(/^\w+:/);
//                 if (m) root = m[0];
//                 path = path.substring(root.length);
//             }
//             if (!isAbsolute) {
//                 res.unshift(path);
//                 isAbsolute = Path.isAbsolute(path);
//             }
//             if (isAbsolute && root != '') {
//                 break;
//             }
//         }

//         if (!isAbsolute) {
//             res.push(CurrentDir);
//         }

//         root = root || Path.parse(CurrentDir).root;
//         res.unshift(root);
// };

export { Url };
