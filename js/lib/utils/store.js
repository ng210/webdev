(function() {

    const LOCAL_STORAGE_KEY = '__STORE';

    function Store(id, options) {
        // id used as localStorage key as well as API key
        this.id = id;
        // options
        // - url: URL of store API
        this.api = Service.create(options.url);
        this.useCache = options.useCache != undefined ? options.useCache : true;
    }

    Store.prototype.write = function write(key, data, options) {
        // options
        // - contentType: mime type of the input
        // - ext: file extension defining content type
        if (this.useCache) {

        }
        if (this.api) {
            this.api[key].update(data);
        }
    };
    Store.prototype.read = function read(key) {
        if (this.useCache) {

        }
        if (this.api) {
            this.api[key].update(data);
        }
    };
    Store.prototype.clearCache = function clearCache(key) {
        if (this.useCache) {
            var store = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (key) {
                if (store[key]) {
                    delete store[key];
                    localStorage.setItem(LOCAL_STORAGE_KEY);
                }
            } else {
                localStorage.removeItem(LOCAL_STORAGE_KEY);
            }            
        }
    };

    publish(Store, 'Store');
})();