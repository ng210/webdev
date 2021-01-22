include('utils/schema.js');
include('service/api.js');
(function(){
    
    function checkApi(api, ctx) {
        ctx.assert(api, '!null');
        message('Endpoints', 1);
        var count = 0;
        for (var i in api.endPoints) {
            var ep = api.endPoints[i];
            count++;
            message(i, 1);
            for (var j in ep.calls) {
                var call = ep.calls[j];
                message(`${j}((${call.request.mimeType},${call.request.charSet})=>(${call.response.mimeType, call.response.charSet}))`);
            }
            _indent--;
        }
        _indent--;
        ctx.assert(count, '=', 2);
    }

    async function test_api() {
        message('Test api', 1);
        const URL = 'http://localhost:4000/js/lib/service/test-service/';
        var api = await Api.Client('/lib/service/test-service/test-service-definition.json');
        test('Should create an API (explicit definition)', ctx => ctx.assert(api, '!null'));
        api = await Api.Client(URL);
        test('Should create an API (implicit  definition)', ctx => ctx.assert(api, '!null'));

        message('Test calls', 1);
        for (var i in api.endpoints) {
            var ep = api.endpoints[i];
            for (var j in ep) {
                var endpoint = ep[j];

                // create input
                var args = [];
                for (var k=0; k<endpoint.request.arguments.length; k++) {
                    var t = endpoint.request.arguments[k].type;
                    var type = Api.schema.types[t];
                    args.push(type.createValue());
                }
                var resp = await endpoint.call(...args);
                var respType = endpoint.response.type;
                var type = typeof respType === 'string' ? Api.schema.types[respType] : Api.schema.types[respType.name];
                test(`${j.toUpperCase()} ${i}(${args}) should return a valid value`, async function(ctx) {
                    ctx.assert(resp, '!null');
                    var isError = resp instanceof Error;
                    if (isError) {
                        message(resp.message);
                        ctx.assert(false);
                    }
                    //     var results = type.validate(resp).length;
                    //     for (var i=0; i<results.length; i++) {
                    //         message(results[i].toString(), 1);
                    //     }
                    //     _indent--;
                    //     ctx.assert(results, '=', 0);
                    // }
                });
            }
        }
        _indent--;
    }

    var tests = () => [
        test_api
    ];

    publish(tests, 'ApiTests');
})();