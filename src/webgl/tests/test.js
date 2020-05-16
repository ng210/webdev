include('/webgl/webgl.js');
include('/webgl/repository.js');
include('/webgl/scene.js');
include('/webgl/pass.js');
include('/webgl/actor.js');
include('/webgl/mesh.js');
include('/webgl/material.js');

(function() {

    var _repository = null;


    function test_registered_classes() {
        test('Should have registered classes', context => {
            context.assert(webGL.Actor.Type, '!=', undefined);
            context.assert(webGL.Mesh.Type, '!=', undefined);
            context.assert(webGL.Material.Type, '!=', undefined);
        });
    }

    function test_repository() {
        _repository = new webGL.Repository();

        test("Should have an index on 'type' for material", async function(context) {
            // load material to trigger index update
            await _repository.addResource('material', 'flat', '/webgl/tests/res/flat.mat');
            context.assert(Object.keys(webGL.Repository.Types[webGL.Material.Type].indices).includes('type'), '=', true);
        });

        test('Should load 1 material', async function (context) {
            var material = await _repository.addResource('material', 'flat', '/webgl/tests/res/flat.mat');
            context.assert(_repository.material.flat, '!=', undefined);
            context.assert(material.id, '=', 'flat');
            material.unload();
        });

        test('Should load 1 mesh', async function (context) {
            var mesh = await _repository.addResource('mesh', 'cube', '/webgl/tests/res/cube.mesh');
            context.assert(_repository.mesh.cube, '!=', undefined);
            context.assert(mesh.id, '=', 'cube');
            mesh.unload();
        });

        test('Should load 1 actor from URL', async function (context) {
            var actor = await _repository.addResource('actor', 'cube', '/webgl/tests/res/cube.actor');
            context.assert(_repository.actor.cube, '!=', undefined);
            context.assert(actor.id, '=', 'cube');
            actor.unload();
        });
    }

    var tests = () => [ test_registered_classes, test_repository ];

    public(tests, 'webGL tests');

})();