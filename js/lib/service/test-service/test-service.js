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
        var type = Api.schema.types[typeName];
        return type.createValue();
    }

    TestApi.prototype.post_bind = function post_bind(res1, res2, req, resp) {
        return createResponse(this);
    };
    TestApi.prototype.get_stats = function get_stats(id, req, resp) {
        return createResponse(this);
    };

    try {
        var api = await Api.Server(TestApi, './test-service-definition.json');
        console.log(api.info());

        api.run();
    } catch (err) {
        console.log(err);
    }
}

run(main);