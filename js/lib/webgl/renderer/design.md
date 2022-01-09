# Concept

The main entity of a rendered scene is the __scene__ itself. The scene consists of __models__.

Technically, the scene is rendered in a singe or multiple __passes__. A pass is a logical collection of resources necessary for rendering to a specific target.

Models can be static or dynamic. Static models do not change their state, while dynamic models like __actors__ are frequently updated.

An actor is a model that has dedicated logic to control (complex animation, user input) its behaviour.

Models consist of __parts__, that are pairs of __mesh__ and __material__.

A mesh describes a geometry using __vertices__ and __indices__.

A material describes the lighting properties of a surface using __textures__ and __shaders__.

Textures are simple __images__ encoded as Uint8 or Float32 with R, RGB or RGBA channels.

Shaders are GLSL vertex and fragment __shader codes__ and their __parameters__ (uniforms).

During or after rendering post-processing __effects__ can be applied on the output.

The state and properties of any of these resources can be changed by custom __logic__. The logic constist of __event handlers__.


# Resources

__Overview__

```
Scene
  ├─Model
  │  └─Part
  │     ├─Mesh
  │     │  ├─Vertices
  │     │  └─Indices
  │     └─Material
  │       ├─Texture
  │       ├─Shader
  │       └─Parameter
  └─Effects
  │  ├─Shader
  │  └─Parameter
  └─Logic
     └─Event handler
```

All resources should have an __id__ and a __name__. The id is used by the internal repository for management, the name is used for human readability.

```Resource(int id, string name)```

### Shader
A shader program compiled from vertex and fragment shaders.

```Shader(string vertexShader, string fragmentShader)```

### Parameter
A parameter is simply a key-value pair, used as a __uniform__ in shaders or a setting of the logic or the renderer.

```Parameter(string key, Object value)```

### Texture
A texture created procedurally or from an image. Textures are also used as render-targets for multi-pass rendering.

```Texture(int width, int height, int type, int format, Image|Function source)```

### Material
Materials are used to specify the lighting properties of a surface.

```Material(Shader shader, Texture[] textures, Parameter[] parameters)```

### Mesh
A mesh contains a buffer of vertex data and a buffer of index data. These should be used to create a VertexBufferObject and an IndexBufferObject (may be bundled as a VertexArrayObject).

```Mesh(ArrayBuffer vertices, ArrayBuffer indices)```

### Part
A part is a component of a model, that combines a mesh and a material. Beside the properties of the link to the parent model, the mesh and the material might have parameters.

```Part(Model parent, Mesh mesh, Material material, Parameter[] parameters)```

#### Parameters
- ```Point origin```: point of connection to the parent Part.
- ```Function[] contraints```: array of functions to apply constraints on Part.

### Model
A model is the top level object of the recursive structure of parts. A model is managed as an entity, that can be controlled by the logic (actor) or marked for rendering.

### Effect2D
2D effects are applied on textures by fragment shaders (DoF, AA, color mapping). Basically, a 2D-effect is a compute shader with an input and an output texture and a parameterized shader code to do the transformation.

```Effect(Texture input, Texture output, Shader code, Parameter[] parameters)```

### Event handler
An event handler is a parameterized functor (function and an object reference) that is attached to an event.

```EventHandler(Object object, Function handler, Parameter[] parameters)```

---

# Repository
A fast, simple and minimalistic database is required to store the resources of the scenes, a repository.
The repository has to support:
 - import/export of resources,
 - query for resources by different attributes.

The basic storage unit is the repository item (__RepoItem__), all Resource types are derived from this.
The default attributes (id and name) of the Resource type can be derived from RepoItem.

```RepoItem(int id, string name, Type type)```

---
# Processes

## Build scene
Construct a scene entity from a script describing every necessary resource.
- Fetch and run scene script.
- Try to fetch resources from the repository.
  - Add new resources if not exists.

##  Prepare scene
Create and initialize all resources required for rendering the components of the scene.
- prepare each component


## Render scene
Render visible items and characters, selected and groupped by pass type, material, LOD.

- iterate through pass types (opaque, translucent, transparent)
- select mesh by viewport culling, material (shader), texture, LOD
- mesh selection is cached
  - define triggers to discard selection

``` javascript
scene = repository.get(sceneId);
// scene(passes, models, effects)
for (model in scene.models)
{
    if (camera.inFrustrum(model.lod[LOD].boundingBox))                    // select LOD, viewport culling
    {
        for (mesh in model.meshes)
        {
            scene.passes.renderList[mesh.material.passType].add(mesh);    // select pass by material
        }
    } 
}

for (pass in scene.passes)
{
    // should be 1 render call: requires unified VBO, IBO
    for (object in pass.renderList)
    {
      render(object);
    }
}
```