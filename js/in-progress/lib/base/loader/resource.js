self.Resource = function Resource(url) {
    this.url = url;    //.normalize();
    //this.resolvedAddress = '';
    this.resolvedUrl = null;
    // loaded data
    this.data = null;
    // created HTML node from the data
    this.node = null;
    // status of the resource
    this.status = Resource.NEW;
    // in case of error the instance of Error
    this.error = null;
}
Resource.load = async function(options) {
    var resource = null;
    try {
        // check resource cache
        var url = new Url(options.url, options.currentPath).toString();
        options.url = url;
        debug_('R.LOAD ' + url.toString(), 3);
        resource = Resource.cache[url];
        if (!resource) {
            // resource not found in cache
            resource = new Resource(url);
            // it will be loaded
            resource.status = Resource.LOADING;
            Resource.cache[url] = resource;
            // load
            await ajax.send(options);
            resource.data = options.response;
            if (options.error != null) {
                resource.error = options.error;
                resource.status = Resource.ERROR;
            } else {
                resource.resolvedUrl = new Url(options.resolvedUrl);
                resource.status = Resource.LOADED;
                if (options.process) {
                    await resource.processContent(options);
                    // update resource
                    resource = Resource.cache[url];
                }
            }
        } else {
            if (resource.status != Resource.COMPLETE && resource.status != Module.RESOLVED) {
                return new Promise( async function(resolve, reject) {
                    var timeOut = 100;
                    poll( function() {
                        if (timeOut > 30000) {
                            resource.status = Resource.ERROR;
                            resource.error = new Error('Time-out reached!');
                            reject(resource);
                            return true;
                        }
                        if (Resource.cache[resource.url].status != Resource.LOADING) {
                            resolve(resource);
                            return true;
                        } else {
                            timeOut *= 1.8;
                            return false;
                        }
                    }, timeOut);
                });
            }
        }
        debug_('R.LOADED ' + resource.toString(), 1);
    } catch (err) {
        resource = resource || {};
        resource.status = Resource.ERROR;
        resource.error = err;
    }
    return resource;
};
Resource.prototype.processContent = async function(options) {
    debug_('R.PROCESS @' + this.url, 3);
    var data = await ajax.processContent(options);
    switch (options.contentType) {
        case 'text/javascript':
            // create Module from Resource
            var mdl = Module.fromResource(this);
            if (mdl.error == null) {
                Resource.cache[this.url] = mdl;
                debug_('R.SCRIPT ' + mdl.toString(), 3);
                await mdl.resolveIncludes();
            }
            break;
        case 'x-shader/*':
        case 'x-shader/x-vertex':
        case 'x-shader/x-fragment':
            // if (!ISWORKER) {
            //     this.node = document.createElement('script');
            //     this.node.setAttribute('type', options.contentType);
            //     this.node.innerHTML = data;
            //     this.node.url = options.url;
            //     document.head.appendChild(this.node);
            // } else {
            //     this.node = data;
            // }
            // break;
        case 'text/xml':
            this.node = data;
            break;
        case 'application/json':
            this.node = null;
            break;
        case 'text/html':
            this.node = data
            this.node.url = options.url;
            break;
        case 'text/css':
            if (!ISWORKER) {
                this.node = document.createElement('style');
                this.node.innerHTML = data;
                this.node.url = options.url;
                document.head.appendChild(this.node);
            } else {
                this.node = data;
            }
            break;
        case 'image/bmp':
        case 'image/gif':
        case 'image/jpg':
        case 'image/png':
            this.node = data;
            break;
        default: this.node = data; break;
    }
    this.status = Resource.COMPLETE;
};
Resource.prototype.toString = function() {
    return `RES@(${this.url}) - (${this.status})`;
};

Resource.cache = {};

Resource.NEW = 'new';
Resource.LOADING = 'loading';
Resource.LOADED = 'loading';
Resource.COMPLETE = 'complete';
Resource.ERROR = 'error';
Resource.ALIAS = 'alias';

Resource.searchPath = [];