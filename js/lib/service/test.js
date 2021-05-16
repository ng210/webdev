include('/lib/utils/schema.js');
include('./api.js');
(function() {
    
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
        const URL = 'http://localhost:4000/js/service/test-service/';
        var api = await Api.Client('/service/test-service/test-service-definition.json');
        test('Should create an API (explicit definition)', ctx => ctx.assert(api, '!null'));
        api = await Api.Client(URL);
        test('Should create an API (implicit  definition)', ctx => ctx.assert(api, '!null'));

        message('Test calls', 1);
        for (var i in api.endpoints) {
            var ep = api.endpoints[i];
            _indent++;
            for (var j in ep) {
                var e = ep[j];
                // create input
                var args = [];
                for (var k=0; k<e.request.arguments.length; k++) {
                    var t = e.request.arguments[k].type;
                    var type = api.schema.types[t];
                    args.push(type.createValue());
                }
                var resp = await e.call(...args);
                var respType = e.response.type;
                var type = typeof respType === 'string' ? api.schema.types[respType] : api.schema.types[respType.name];
                test(`${j.toUpperCase()} ${i}(${JSON.stringify(args)}) should return a valid value`, async function(ctx) {
                    ctx.assert(resp.data, '!null');
                    var isError = resp.error instanceof Error;
                    if (isError) {
                        message(resp.error.message);
                        if (resp.error.details) {
                            message(resp.error.details);
                        }
                        ctx.assert(false);
                    }
                });
            }
            _indent--;
        }
        _indent--;
    }

    var tests = () => [
        test_api
    ];

    publish(tests, 'ApiTests');
})();