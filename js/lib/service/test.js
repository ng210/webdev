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

    async function test_schema() {
        header('Test service schema');
        var schema = await Schema.load('./service-schema.json');
        test('Should load and build service schema', ctx => {
            ctx.assert(schema, '!null');
            ctx.assert(schema.types.size, '>', 0);
            ctx.assert(Object.keys(schema.missingTypes).length, '=', 0);
        });
    }

    async function test_schema_validate() {
        header('Test validate against service schema');
        var schema = await Schema.load('./service-schema.json');
        var res = await load('/service/test-service/test-service-definition.json');
        if (!res.error && res.data.imports) {
            await schema.importTypes(res.data.imports);
        } else {
            error('Could not load definition!');
        }
        test('Should load and validate service definition', ctx => {
            ctx.assert(schema, '!null');
            ctx.assert(res.error, 'null');
            var results = schema.validate(res.data, 'Service');
            ctx.assert(results.length, '=', 0);
            for (var i=0; i<results.length; i++) {
                message(results[i]);
            }
        });
    }

    async function test_api() {
        header('Test api client');
        var api = await Api.Client('/service/test-service/test-service-definition.json');
        test('Should create an API (explicit definition)', ctx => ctx.assert(api, '!null'));
        const URL = 'http://localhost:4000/js/service/test-service/';
        api = await Api.Client(URL);
        test('Should create an API (implicit definition)', ctx => ctx.assert(api, '!null'));

        await test('Should call each endpoint and method', async function(ctx) {
            var success = true;
            // ignore instance validation
            api.schema.getInstance = () => true;
            for (var j in api.endpoints) {
                var ep = api.endpoints[j];
                for (var i in ep.calls) {
                    var call = ep.calls[i];
                    message(`Test call to '${j}.${i}'`);
                    // create dummy arguments
                    var data = [];
                    for (var i=0; i<call.request.arguments.length; i++) {
                        var arg = call.request.arguments[i];
                        var value = null;
                        if (!(arg.type instanceof RefType)) {
                            value = arg.type.createValue();
                        } else {
                            var instance = arg.type.baseType.createValue();
                            api.schema.addInstance(instance);
                            value = instance[arg.type.baseType.ref];
                        }
                        data.push(value.valueOf());
                    }
                    var response = await call.do(...data);
                    if (response.error) {
                        error(response.error);
                        success = false;
                    }
                    break;
                }
            }
            ctx.assert(success, 'true');
        });
        //     var ep = api.endpoints[i];
        //     _indent++;
        //     for (var j in ep) {
        //         var e = ep[j];
        //         // create input
        //         var args = [];
        //         for (var k=0; k<e.request.arguments.length; k++) {
        //             var t = e.request.arguments[k].type;
        //             var type = api.schema.types[t];
        //             args.push(type.createValue());
        //         }
        //         var resp = await e.call(...args);
        //         var respType = e.response.type;
        //         var type = typeof respType === 'string' ? api.schema.types[respType] : api.schema.types[respType.name];
        //         test(`${j.toUpperCase()} ${i}(${JSON.stringify(args)}) should return a valid value`, async function(ctx) {
        //             ctx.assert(resp.data, '!null');
        //             var isError = resp.error instanceof Error;
        //             if (isError) {
        //                 message(resp.error.message);
        //                 if (resp.error.details) {
        //                     message(resp.error.details);
        //                 }
        //                 ctx.assert(false);
        //             }
        //         });
        //     }
        //     _indent--;
    }

    var tests = () => [
        test_schema,
        test_schema_validate,
        test_api
    ];

    publish(tests, 'ApiTests');
})();