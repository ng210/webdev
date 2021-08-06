include('repository.js');

(function() {

    var repo = null;
    async function setup() {
        // create repository
        repo = await GE.Repo.create('ge-repo.json');
        // register component, actor and logic
        await repo.register('item.json');
        await repo.register('component.json');
        await repo.register('actor.json');
        await repo.register('part.json');
        await repo.register('logic.json');
    }

    async function test_repository() {
        header('Test GE-Repository');
        await setup();
        var types = repo.repository.schema.types;

        // check types
        test('Should register repository entities', ctx => {
            ctx.assert(types['Repo-Item'], '!null');
            ctx.assert(types['Repo-Component'], '!null');
            ctx.assert(types['Repo-Actor'], '!null');
            ctx.assert(types['Repo-Logic'], '!null');
        });

        test('Should derive entities from Repo-Item', ctx => {
            ctx.assert(types['Repo-Component'].baseType, '=', types['Repo-Item']);
            ctx.assert(types['Repo-Logic'].baseType, '=', types['Repo-Item']);
            ctx.assert(types['Repo-Actor'].baseType, '=', types['Repo-Component']);
        });

        // load entities


    }

    var tests = () => [
        test_repository
    ];

    publish(tests, 'GE-Repo tests');
})();