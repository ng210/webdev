(function() {
    var getResult = function(error, data) {
        var result = { 'error': error instanceof Error ? error.message : error, 'data': data || [] };
        return JSON.stringify(result);
    };
    module.exports = {
        create: sid => {
            return getResult(`Got object ${JSON.stringify(sid)}.`);
        },
        retrieve: search => {
            return getResult(`Search is ${JSON.stringify(search)}`);
        },
        update: (search, obj) => {
            return getResult(`Update objects ${JSON.stringify(search)} with ${JSON.stringify}`);
        },
        delete: search => {
            return getResult(`Search is ${JSON.stringify(search)}`);
        }
    };
})();