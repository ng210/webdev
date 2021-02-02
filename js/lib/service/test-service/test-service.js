const fs = require('fs');
//global.http = require('http');
require('service/nodejs.js');
include('/lib/service/api.js');

async function main(args, errors) {
    if (errors.length > 0) {
        for (var i=0; i<errors.length; i++) {
            console.log('Error: ' + errors[i].message);
        }
        return 0;
    }
    function TestApi(definition) {
        TestApi.base.constructor.call(this, definition);
    }
    extend(ApiServer, TestApi);
    
    function createResponse(ep) {
        var typeName = ep.response.type;
        if (typeof typeName === 'object') typeName = typeName.name;
        var type = ep.api.schema.types[typeName];
        return type.createValue();
    }

    TestApi.prototype.post_bind = function post_bind(res1, res2, req, resp) {
        return createResponse(this);
    };
    TestApi.prototype.get_stats = function get_stats(id, req, resp) {
        return createResponse(this);
    };

    //#region RES1 handlers
    TestApi.prototype.create_res1 = function create_res1(res1) {
        return res1;
    };
    TestApi.prototype.retrieve_res1 = function retrieve_res1(id) {
        var res = createResponse(this)
        res.id = id;
        return res;
    };
    TestApi.prototype.update_res1 = function update_res1(res1) {
        return res1;
    };
    //#endregion

    //#region RES2 handlers
    TestApi.prototype.create_res2 = function create_res2(res1) {
        return res1;
    };
    TestApi.prototype.update_res2 = function update_res2(res1) {
        return res1;
    };
    TestApi.prototype.retrieve_res2 = function retrieve_res2(id) {
debugger
        var res = createResponse(this);
        res.id = id;
        return res;
    };
    TestApi.prototype.delete_res2 = function delete_res2(id) {
        var res = createResponse(this);
        res.id = id;
        return res;
    };
    //#endregion

    try {
        var api = await Api.Server(TestApi, './test-service-definition.json');
        console.log(api.info());

        api.run();
    } catch (err) {
        console.log(err);
    }
}

run(main);