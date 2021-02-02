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
                    ctx.assert(resp, '!null');
                    var isError = resp instanceof Error;
                    if (isError) {
                        message(resp.message);
                        if (resp.details) {
                            message(resp.details);
                        }
                        ctx.assert(false);
                    }
                });
            }
            _indent--;
        }
        _indent--;
    }

    async function test_store() {
        message('Test Store api', 1);
        var api = await Api.Client('http://localhost:4000/store');
        test('Should create a Store Api client', ctx => ctx.assert(api, '!null'));

        var user = await api.create({ 'name':'Test User' }, 'User');
        test('Should create a User', ctx => ctx.assert(user.error instanceof Error, 'false'));
        var user2 = await api.retrieve(user.id, 'User');
        test('Should retrieve the User', ctx => ctx.assert(user, ':=', user2));
        user2.name = 'Test User2';
        var user = await api.update(user2, 'User');
        test('Should update the User', ctx => ctx.assert(user, ':=', user2));
        var user = await api.delete(user.id, 'User');
        test('Should delete the User', ctx => ctx.assert(user, ':=', user2));

        var store = await api.create({ 'name':'MyStore', 'owner':user.id }, 'Store');
        test('Should create a Store', ctx => ctx.assert(store.error instanceof Error, 'false'));

        var item = await api.create({ 'name':'MyItem', 'owner':user.id, 'store':store.id }, 'Item');
        test('Should create an Item', ctx => ctx.assert(item.error instanceof Error, 'false'));
    }

    var tests = () => [
        test_api
        //test_store
    ];

    publish(tests, 'ApiTests');
})();