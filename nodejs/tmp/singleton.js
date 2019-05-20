(function() {
    
    var singleton = {
        token: 0,
        getSingleton: function(req, resp) {
            resp.end(`singleton.token = ${singleton.token}`);
        },
        setSingleton: function(value, resp) {
            singleton.token = value;
            setTimeout(function(resp) {
                resp.end(`singleton.token = ${singleton.token}`);
            }, 3000, resp);
            return singleton.token;
        }
    };

    module.exports = singleton;
})();