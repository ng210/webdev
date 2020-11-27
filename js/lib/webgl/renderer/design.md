# Concept
A scene consists of items (static models), actors (dynamic, animated models) using a logic to control animation.
Effects can be applied on the whole scene or on particular components.

Scene
- models
  - items
  - actors
- effects
- logic

---

## Components

### Models
- hierarchic structure: consist of sub-models or parts
- defines parent-child relations

### Parts
- associates a mesh and a material

### Items
- models that are not animated (skybox, terrain, fully static objects)

### Actors
- animated models (player, NPC, moveable/destuctible objects)

### Materials
- describe surface features
  - modelling by programs
  - textures

### Meshes
- set of vertices

### Textures
- 2d images or videos

### Effects
- 2D (fragment shader) effects applied on components (DoF, AA, color mapping)
- 3D effects?

### Logic
- formulas and constraints of character parameters
- conditions to control rendering of components
