include('webgl/renderer/renderer.js');

(function() {

    var _repo = new webGL.Repository();


    function test_registered_classes() {
        test('Should have registered classes', context => {
            context.assert(webGL.Actor.Type, '!=', undefined);
            context.assert(webGL.Mesh.Type, '!=', undefined);
            context.assert(webGL.Material.Type, '!=', undefined);
        });
    }

    async function test_repository() {
        test('Should have registered classes in the Repository', context => {
            context.assert(_repo.Types[webGL.Actor.Type], '!=', undefined);
            context.assert(_repo.Types[webGL.Mesh.Type], '!=', undefined);
            context.assert(_repo.Types[webGL.Material.Type], '!=', undefined);
        });

        await test("Should have an index on 'type' for material", async function(context) {
            // load material to trigger index update
            await _repo.addResource('material', 'flat', '/lib/webgl/tests/res/flat.mat');
            context.assert(Object.keys(webGL.Repository.Types[webGL.Material.Type].indices).includes('type'), '=', true);
        });

        test('Should load 1 material', async function (context) {
            var material = await _repo.addResource('material', 'flat', '/lib/webgl/tests/res/flat.mat');
            context.assert(_repo.material.flat, '!=', undefined);
            context.assert(material.id, '=', 'flat');
            material.unload();
        });

        test('Should load 1 mesh', async function (context) {
            var mesh = await _repo.addResource('mesh', 'cube', '/lib/webgl/tests/res/cube.mesh');
            context.assert(_repo.mesh.cube, '!=', undefined);
            context.assert(mesh.id, '=', 'cube');
            mesh.unload();
        });

        test('Should load 1 actor from URL', async function (context) {
            var actor = await _repo.addResource('actor', 'cube', '/lib/webgl/tests/res/cube.actor');
            context.assert(_repo.actor.cube, '!=', undefined);
            context.assert(actor.id, '=', 'cube');
            actor.unload();
        });
    }

    var tests = () => [ test_registered_classes, test_repository ];

    publish(tests, 'webGL tests');

})();