//include('./store-api.js');
include('/lib/service/api.js');

(function() {

    var publicDomain = null;

    function message_errors(errors) {
        for (var i=0; i<errors.length; i++) {
            message(errors[i].toString());
        }
    }

    async function create_api() {
        var api = await Api.Client('http://localhost:4000/store');
        test('Should create a Store Api client', ctx => ctx.assert(api, '!null'));
        return api;
    }

    // async function test_store() {
    //     message('Test Store api', 1);
    //     var api = await Api.Client('http://localhost:4000/store');
    //     test('Should create a Store Api client', ctx => ctx.assert(api, '!null'));

    //     var user = await api.create({ 'name':'Test User' }, 'User');
    //     test('Should create a User', ctx => ctx.assert(user.error instanceof Error, 'false'));
    //     var user2 = await api.retrieve(user.id, 'User');
    //     test('Should retrieve the User', ctx => ctx.assert(user, ':=', user2));
    //     user2.name = 'Test User2';
    //     var user = await api.update(user2, 'User');
    //     test('Should update the User', ctx => ctx.assert(user, ':=', user2));
    //     var user = await api.delete(user.id, 'User');
    //     test('Should delete the User', ctx => ctx.assert(user, ':=', user2));

    //     var store = await api.create({ 'name':'MyStore', 'owner':user.id }, 'Store');
    //     test('Should create a Store', ctx => ctx.assert(store.error instanceof Error, 'false'));

    //     var item = await api.create({ 'name':'MyItem', 'owner':user.id, 'store':store.id }, 'Item');
    //     test('Should create an Item', ctx => ctx.assert(item.error instanceof Error, 'false'));
    // }

    async function test_login() {
        message('Test Login', 1);
        var api = await create_api();
        var token = await api.login('admin', 'admin');
        test('Should return a token', ctx => {
            ctx.assert(token instanceof Error, 'false');
            ctx.assert(localStorage.getItem('store-token'), '!null');
        });
        var result = await api.endpoints.domains.get.call();
        test('Should access the domains endpoint', ctx => {
            ctx.assert(result.error, 'null');
        });

        result = await api.login('admin', 'baka');
        test('Should return 401 on wrong password', ctx => {
            ctx.assert(result instanceof Error, 'true');
            ctx.assert(result.statusCode, '=', 401);
        });

        result = await api.login('admin', 'admin');
        test('Should return a new token', ctx => {
            ctx.assert(result instanceof Error, 'false');
            ctx.assert(localStorage.getItem('store-token'), '!null');
            ctx.assert(result, '!=', token);
        });

        localStorage.setItem('store-token', token);
        result = await api.endpoints.domains.get.call();
        test('Should have no access using the old token', ctx => {
            ctx.assert(result.error instanceof Error, 'true');
            ctx.assert(result.statusCode, '=', 401);
        });
    }

    function checkErrors(resp, ctx) {
        ctx.assert(resp.error instanceof Error, 'false');
        if (resp.error instanceof Error)
        message(resp.error);
    }

    async function test_resource(api, typeName) {
        message('Test ' + typeName, 1);
        // Create
        var name = 'My' + typeName;
        var tn = typeName.toLowerCase();
        var resp = await api.rest[tn].create({name});
        var res = resp.data;
        test(`Should create a '${typeName}' object`, ctx => {
            checkErrors(resp, ctx);
            ctx.assert(res.name, '=', name);
        });
        resp = await api.rest[tn].create(res);
        test('Should get 409 on duplicate', ctx => {
            ctx.assert(resp.statusCode, '=', 409);
            ctx.assert(resp.data, ':=', res);
        });
        // Read
        resp = await api.rest[tn].read(res.id);
        test(`Should retrieve the '${typeName}' object`, ctx => {
            checkErrors(resp, ctx);
            ctx.assert(resp.data, ':=', res);
        });
        resp = await api.rest[tn+'s'].get();
        test(`Should retrieve all '${typeName}' objects`, ctx => {
            checkErrors(resp, ctx);
            if (!resp.error) {
                ctx.assert(Array.isArray(resp.data), 'true');
                ctx.assert(resp.data.length, '>', 0);
                for (var i=0; i<resp.data.length; i++) {
                    message(JSON.stringify(resp.data[i], null, '  '));
                }
            }    
        });
        resp = await api.rest[tn].read(999999);
        test('Should get 404 on missing data', ctx => {
            ctx.assert(resp.statusCode, '=', 404);
        });

        // Update
        res.name += '*';
        resp = await api.rest[tn].update(res);
        test(`Should update '${typeName}' object`, ctx => {
            checkErrors(resp, ctx);
            ctx.assert(resp.data.name, '=', res.name);
        });
        
        // Delete
        resp = await api.rest[tn].delete(res.id);
        test(`Should delete '${typeName}' object`, ctx => {
            checkErrors(resp, ctx);
            ctx.assert(resp.statusCode, '=', 200);
            ctx.assert(resp.data, ':=', res);
        });
        resp = await api.resourceAction(res.id, typeName, 'read');
        test(`Should get 404 for the deleted '${typeName}'`, ctx => {
            ctx.assert(resp.statusCode, '=', 404);
        });
    }

    async function test_domain() {
        message('Test domain actions', 1);
        var api = await create_api();
        await api.login('admin', 'admin');

        await test_resource(api, 'Domain');

        var resp = await api.resourceAction({name:'MyDomain'}, 'Domain', 'create');
        var myDomain = resp.data;
        var resp = await api.endpoints['domains'].get.call();
        test('Should retrieve the public domain', ctx => {
            ctx.assert(resp.error, 'null');
            ctx.assert(Array.isArray(resp.data), 'true');
            for (var i=0; i<resp.data.length; i++) {
                if (resp.data[i].name == 'public') publicDomain = resp.data[i];
                else if (resp.data[i].name.startsWith('MyDomain')) myDomain = resp.data[i];
            }
            ctx.assert(publicDomain, '!null');
            ctx.assert(myDomain, '!null');
        });
        myDomain.parent = publicDomain.id;
        resp = await api.resourceAction(myDomain, 'Domain', 'update');
        test('Should update the parent to public domain', ctx => {
            ctx.assert(resp.data, '!null');
            ctx.assert(resp.error, 'null');
            if (resp.data) {
                ctx.assert(resp.data.parent, '=', publicDomain.id);
            }
        });
        await api.resourceAction(myDomain.id, 'Domain', 'delete');
    }

    async function test_user() {
        message('Test user actions', 1);
        var api = await create_api();
        await api.login('admin', 'admin');
        await test_resource(api, 'User');
    }

    async function test_group() {
        message('Test group actions', 1);
        var api = await create_api();
        await api.login('admin', 'admin');
        await test_resource(api, 'Group');
    }

    var tests = () => [
        test_login,
        test_domain,
        test_user,
        test_group
    ];

    publish(tests, 'Data tests');
})();