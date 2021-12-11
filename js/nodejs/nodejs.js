// DO NOT FORGET TO SET THE NODE_PATH ENV.VARIABLE
// TO USE A CUSTOM JSLIB PATH SET IT AS ENV.VARIABLE

const fs = require('fs');
const http = require('http');
require('url');
const path = require('path');
//const { getHeapCodeStatistics, getHeapSnapshot } = require('v8');
global.self = global;
global.jsLib = process.env.jslib || path.resolve(__dirname, '..');
console.log('jslib: ' + jsLib);

global.DBGLVL = 0;

require(jsLib+'/base/base.js');
console.log('require base lib');

function _processContent(contentType, data) {
    var response = data;
    switch (contentType) {
        case 'application/json':
            response = JSON.parse(data);
            break;
        case 'text/javascript':
        case 'x-shader/*':
        case 'x-shader/x-vertex':
        case 'x-shader/x-fragment':
        case 'text/xml':
        case 'text/html':
        case 'text/css':
        case 'image/bmp':
        case 'image/gif':
        case 'image/jpg':
        case 'image/png':
        default:
            break;
    }
    return response;
}

ajax.send = function send(options) {
    var type = ajax.getTypeByExtension(options.url);
    options.contentType = options.contentType || type.mimeType;
    options.responseType = options.responseType || type.responseType;
    options.charSet = options.charSet || type.charSet;
    var target = options.url;
    // Check options.url to
    // load from file system
    // download from URL
    var res = null;
    debug_('AJX.FETCH: ' + target, 2);
    if (target.startsWith('/')) target = target.substr(1);
    var targetUrl = new Url(target);
    switch (targetUrl.schema) {
        case 'http://':
            debug_('AJX.GETFILE: ' + options.url, 3);
            res = new Promise(resolve => {
                var url = new URL(options.url);
                res = http.get({
                    method: options.method,
                    host: url.hostname,
                    path: url.pathname,
                    port: url.port,
                    protocol: url.protocol
                }, resp => {
                    options.charSet = options.charSet || 'utf-8';
                    options.error = null;
                    const { statusCode } = resp;
                    const contentType = resp.headers['content-type'];
    
                    if (statusCode !== 200) {
                        options.error = new Error(`Request Failed: Status Code: ${statusCode}`);
                    } else if (!contentType.startsWith(options.contentType)) {
                        options.error = new Error(`Invalid content-type.\n: Expected ${options.contentType} but received ${contentType}`);
                    }
                    
                    if (options.error) {
                        debug_('AJX.' + options.error, 2);
                        resp.resume();
                        resolve(options);
                    } else {
                        resp.setEncoding(options.charSet);
                        var rawData = '';
                        resp.on('data', chunk => { rawData += chunk; });
                        resp.on('end', () => {
                            try {
                                options.resolvedUrl = options.url;
                                options.response = _processContent(options.contentType, rawData);
                            } catch (e) {
                                options.error = e.message;
                            }
                            resolve(options);
                        });
                    }
                }).on('error', (e) => {
                    options.error = `Got error: ${e.message}`;
                    resolve(options);
                });
            });
            break;
        case 'file://':
        default:
            debug_('AJX.READFILE: ' + target, 3);
            //if (fs.existsSync(target))
            res = new Promise(resolve => {
                try {
                    options.charSet = options.charSet || 'utf-8';
                    fs.readFile(new URL(target), {encoding:options.charSet}, (err, data) => {
                        options.response = data;
                        if (err) {
                            options.error = new Error(target + ' - ' + err.message);
                        } else {
                            options.resolvedUrl = target;
                            options.response = _processContent(options.contentType, data);
                        }
                        resolve(options);
                    });
                } catch (err) {
                    options.error = `${err} (${target})`;
                    resolve(options);
                }
            });
            break;
    }

    return res;
};

global.appUrl = new Url(`file://${path.dirname(require.main.filename).replace(/\\/g, '/')}`);
global.baseUrl = new Url(`file://${path.resolve(jsLib, '..').replace(/\\/g, '/')}`);
console.log('BaseUrl: ' + baseUrl.toString());
console.log('AppUrl: ' + appUrl.toString());

// (async function() {
//     var tests = [
//         'http://localhost:3000/js/todos.json',
//         'file://d:/code/git/webdev/js/todos.json',
//         'file://../../todos.json',
//         'file:///../todos.json',
//         '/../todos.json',
//         '../../todos.json',
//         //'user:password@www.example.com:8080/folder/index.html?p1=A&p2=B&p3#ressource',
//         // '/folder/index.html?p1=A&p2=B#ressource',
//         // 'host/index.html?p1=A&p2=B#ressource',
//         // '/folder/index.html?p1=A&p2=B#ressource',
//         // 'c:/folder1/folder2/file.txt',
//         // './folder1/folder2/file.txt',
//         // '../../folder3/file.txt'
//     ];
//     for (var i=0; i<tests.length; i++) {
//         var res = await load(new Url(tests[i]).toString());
//         console.log(tests[i] + ' => '+ (res.error ? res.error : res.status));
//     }
// })();

global.btoa = function btoa(text) {
    return Buffer.from(text, 'binary').toString('base64');
};
global.atob = function atob(code) {
    return Buffer.from(code, 'base64').toString('binary');
};


global.run = async function run(main) {
    poll(async function() {
        var errors = [];
        for (var i in Resource.cache) {
            var res = Resource.cache[i];
            if (res.status == Resource.ERROR) {
                errors.push(res.error);
            } else if (res.status != Resource.COMPLETE && res.status != Resource.ERROR && res.status != Module.RESOLVED && res.status != Resource.ALIAS) {
                return false;
            }
        }

        main(process.argv, errors);
        return true;
    });    
};
