# Concept

## Entities
- a pass contains models (items and actors) pre-selected by render type (opaque, translucent, transparent, ...)
- a model consists of sub-models or parts
- a part consists of meshes and materials
- a material consists of a shader program, textures and parameters
- a program is compiled from a vertex and a fragment shader
- a texture is a 2D image or a video

## Management
The rendering process requires an efficient repository of components.
- support query by pass position, type, LoD, material
- support for import/export
- support for scripting

## Scripting
- scenes are described by scripts
  - list of components
  - application of logic and effects

---

# Classes

## Management
 RepoItem(id, type, references)
 Repository()

## Repository Items
 Scene:RepoItem(background, items, characters, passes, effects, logic)
 Pass(type, materialMeshes, target)
 Model(materials, meshes)
 Actor:Model(bones/joints, logic)
 Mesh(LOD, vertices, indices)
 Material(program, textures, parameters)
 Program(shaders, attributes, uniforms)
 Effect(source, target, shader, resources)
 Resource(type)
 Logic(?)

---

# Processes

## Build scene
Create a scene entity with all its components created and available
- optional: load complete repository
- build scene: fetch and run scene script
  - try to fetch components from repository
    - create component if not exists

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