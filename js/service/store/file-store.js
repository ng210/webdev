const fs = require('fs');
include('/lib/data/repository.js');

(function() {
    function FileStore(settings) {
        settings = settings || {};
        this.path = settings.path || process.cwd();
        // build index
        this.indexByOwner = {};
        this.indexByStore = {};
        this.indexByName = {};
        var files = fs.readdirSync(this.path, { encoding: 'utf-8', withFileTypes:true });
    debugger
        for (var i=0; i<files.length; i++) {
            var file = files[i];
            if (file.isFile() && file.name.endsWith('.st')) {
                // Format of file name: SSSSOOIIII.st
                // - S: store id (0000-FFFF)
                // - O: owner id (00-FF)
                // - I: item id (0000-FFFF)
                var tokens = file.name.split('_');
            }
        }
    }

    FileStore.prototype.write = function write(meta, data) {

    };
    FileStore.prototype.read = function read(meta) {
        
    };

    publish(FileStore, 'FileStore');
})();


