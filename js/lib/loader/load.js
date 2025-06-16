import { Url } from './url.js'

async function _load(args) {
    let result = null;
    try {
        // construct url from 
        let url = args;
        if (typeof args === 'object') {
            url = new Url(args.url, args.base || '').toString();
        }

        let method = args.method || 'GET';
        let data = args.data || null;
        let headers = args.headers || {};
        let contentType = '';
        if (args.contentType) contentType = args.contentType;
        else {
            // get content type by the extension
            let ix = url.lastIndexOf('.');
            if (ix != -1 && ix > 0) {
                let ext = url.substring(ix+1);
                contentType = load.ext2contentType[ext] || 'application/octet-stream';
            }
        }
        headers['Content-Type'] = headers['Content-Type'] || contentType;

        let resp = await fetch(url, {
            method: method,
            headers: headers,
            body: data
        });

        if (resp.ok) {
            // get data-type by content-type
            let dataType = load.contentType2dataType[contentType] || 'blob';
            result = await resp[dataType]();
        } else {
            throw new Error(`${resp.status} ${resp.statusText}`);
        }
    } catch (err) {
        console.error(err);
        result = err;
    }
    return result;
}

async function load(args) {
    if (Array.isArray(args)) {
        let promises = [];
        for (var item of arr) {
            promises.push(_load(item));
        }
        return await Promise.all(promises);
    } else {
        return await _load(args);
    }
}

load.ext2contentType = {};

load.contentType2dataType = {};
load.addType = function addType(ext, contentType, dataType) {
    load.ext2contentType[ext] = contentType;
    load.contentType2dataType[contentType] = dataType;
};

load.addType('txt', 'text/plain', 'text');
load.addType('json', 'application/json', 'json');
load.addType('bin', 'application/octet-stream', 'blob');
load.addType('gif', 'image/gif', 'blob');
load.addType('png', 'image/png', 'blob');
load.addType('jpg', 'image/jpg', 'blob');
load.addType('css', 'text/css', 'text');
load.addType('xml', 'text/xml', 'text');
load.addType('html', 'text/html', 'text');
load.addType('vs', 'text/plain', 'text');
load.addType('fs', 'text/plain', 'text');

export { load }