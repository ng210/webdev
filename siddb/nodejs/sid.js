(function() {
    var getResult = function(error, data) {
        var result = { error: error instanceof Error ? error.message : error, data: data || [] };
        return JSON.stringify(result);
    };
    function _search(database, check) {
        var data = [];
        for (var i in database) {
            var entry = database[i];
            if (check(entry)) {
                data.push(entry);
            }
        }
        return data;
    }

    module.exports = {
        create: sid => {
            return getResult(`Got object ${JSON.stringify(sid)}.`);
        },
        retrieve: search => {
            var database = require(__dirname + '/database.json');
            var data = [];

            if (search.text) {
                var key = search.text.toUpperCase();
                data = _search(database, entry => {
                    for (var k in entry) {
                        var str = entry[k].toString().toUpperCase();
                        if (str.indexOf(key) != -1) {
                            return true;
                        }
                    }
                    return false;
                });
            }
            if (search.author) {
                var author = search.author.toUpperCase();
                data = _search(data, entry => entry.author.toUpperCase().indexOf(author) != -1);
            }
            return getResult('', data);
        },
        update: (search, obj) => {
            return getResult(`Update objects ${JSON.stringify(search)} with ${JSON.stringify}`);
        },
        delete: search => {
            return getResult(`Search is ${JSON.stringify(search)}`);
        }
    };
})();