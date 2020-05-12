include('/webgl/repo-item.js');
include('/webgl/pass.js');
// ********************************************************************************************
//
// Material
//
// ********************************************************************************************
(function() {
	function Material(id, data) {
		Material.base.constructor.call(this, id);
		this.type = webGL.Pass.Types.Opaque;
		this.program = null;
		this.textures = [];
		this.parameters = {};
	}
	extend(webGL.RepoItem, Material);

	Material.prototype.onunload = function onunload() {
		// unload resources
	};

	Material.prototype.addProgram = function addProgram(shaders) {
		// compile shaders
		// and set program
    }
    

    webGL.Repository.registerClass('material', Material);

    public(Material, 'Material', webGL);
})();
