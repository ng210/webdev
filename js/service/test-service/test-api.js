include('/lib/service/api.js');

(function() {
    function TestApi(definition) {
        TestApi.base.constructor.call(this, definition);
        // ignore instance validation
        this.schema.getInstance = () => true;
    }
    extend(ApiServer, TestApi);

    function createResponse(call) {
        return call.response && call.response.type ? call.response.type.createPrimitiveValue() : null;
    }

    TestApi.prototype.post_bind = function post_bind(res1, res2, req, resp) {
        return createResponse(this);
    };
    TestApi.prototype.get_stats = function get_stats(id, req, resp) {
        return createResponse(this);
    };
    TestApi.prototype.login = function login(user, password, remoteAddress) {
        return 'test-token';
    }

    //#region RES1 handlers
    TestApi.prototype.create_res1 = function create_res1(res1) {
        return res1.id;
    };
    TestApi.prototype.read_res1 = function read_res1(id) {
        var res = createResponse(this)
        res.id = id;
        return res;
    };
    TestApi.prototype.update_res1 = function update_res1(res1) {
        return res1.id;
    };
    //#endregion

    //#region RES2 handlers
    TestApi.prototype.create_res2 = function create_res2(res2) {
        return res2.id;
    };
    TestApi.prototype.read_res2 = function read_res2(id) {
        var res = createResponse(this);
        res.id = id;
        return res;
    };
    TestApi.prototype.update_res2 = function update_res2(res2) {
        return res2.id;
    };
    TestApi.prototype.delete_res2 = function delete_res2(id) {
        var res = createResponse(this);
        res.id = id;
        return res;
    };
    //#endregion
    publish(TestApi, 'TestApi');
})();