# Render process
- iterate through pass types (opaque, translucent, transparent)
- select mesh
  - by LOD
  - by material (shader) and texture
- mesh selection is cached
  - triggers to discard selection
- lights?
- shadows?
- ambient occlusion?
- post processing?

# Management
- repository
  - fast queryable: indexed, sorted
  - items are
    - actors
    - meshes
    - materials
    - textures

# Structures
