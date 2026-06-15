IRenderObject
- vec2 getPosition()
- float getRotation()
- vec2 getScale()

IPlayerDevice
- processCommand(cmd, args)

Renderer
- update(IRenderObject)
  - translate (position)
  - rotate (rotation)
  - scale (scale)
- render(Context)

Actor : IRenderObject, IPlayerDevice
- constraints
  - range validation
  - collision
  - hierarchy
- physics
  - position
  - rotation
  - scale
  - velocity
  - forces
- renderer : Renderer

interface <-> composition




**Layered engine architecture**

* Physics
* Collision detection
* Rendering abstraction (Canvas, DOM, potentially WebGL/3D)
* Animation systems
* Clean TypeScript design
* Easy renderer swapping

Engine **Entity-Component-System (ECS) elvek** szerint.
A játék logikáját nem befolyásolhatja a rendering.
A fizikai testek számára lényegtelen, hogy milyen módon jelenítik meg őket.

---

# High-Level Architecture

```text
+-------------------+
|     GameEngine    |
+-------------------+
          |
    +-----+-----+
    |           |
+--------+   +---------+
| Scene  |   | Systems |
+--------+   +---------+
                |
    +-----------+-----------+
    |           |           |
 Physics    Collision   Animation

            Components
                |
          Renderer API
                |
      +---------+---------+
      |         |         |
 Canvas2D   DOMRenderer  WebGLRenderer
```

---

# Core Engine Layer
Ez az osztály tartalmazza
- a teljes színt (scene),
- a kiválasztott Renderer alrendszert,
- az input kezelését,
- a játék állapotának aktualizálását és
- és a megjelenítést.

```typescript
class GameEngine {
    private scene: Scene;
    private renderer: IRenderer;

    start(): void {}

    stop(): void {}

    processInputs(): void {}

    update(dt: number): void {}

    render(): void {}
}
```
Az aktualizálás az alrendeszereket is használja:
```typescript
update()
{
    physicsSystem.update();
    collisionSystem.update();
    animationSystem.update();

    renderer.render(scene);
}
```

---

# Szín (jelenet)
A szín tartalmazza az összes játék entitást.

```typescript
class Scene {
    entities: Entity[] = [];

    add(entity: Entity): void {}
}
```

Például:
```text
Scene
 ├── Player
 ├── Enemy
 ├── Tree
 └── Bullet
```

---

# Entitás

Az entitás csupán egy azonosítóval ellátott tároló.

```typescript
class Entity {
    id: string;
    components: Map<string, IComponent>;
}
```
A megjelenítés, fizikai modellezés, animálás a komponensek feladata lesz.

---

# Komponensek

A komponensek írják le a képességeket, viselkedést.

```typescript
interface IComponent {}
```

Példák:

- Transform
```typescript
class TransformComponent implements IComponent
{
    x: number;
    y: number;

    rotation: number;

    scaleX: number;
    scaleY: number;
}
```

---

Sprite

```typescript
class SpriteComponent implements IComponent
{
    imageId: string;
}
```

---

Physics

```typescript
class PhysicsComponent implements IComponent
{
    velocityX: number;
    velocityY: number;

    mass: number;
}
```

---

Collider

```typescript
class ColliderComponent implements IComponent
{
    width: number;
    height: number;
}
```

---

Animation

```typescript
class AnimationComponent implements IComponent
{
    currentSequence: AnimationSequence;
}
```

---

# Systems

Systems operate on entities.

This keeps code clean.

---

Physics System

```typescript
class PhysicsSystem
{
    update(dt: number): void
    {
        // update positions
    }
}
```

Looks for:

```text
TransformComponent
PhysicsComponent
```

---

Collision System

```typescript
class CollisionSystem
{
    update(): void
    {
        // detect intersections
    }
}
```

Looks for:

```text
Transform
Collider
```

---

Animation System

```typescript
class AnimationSystem
{
    update(dt: number): void
    {
    }
}
```

Looks for:

```text
AnimationComponent
```

---

# Rendering Abstraction

This is the most important part for your requirements.

Define a renderer contract.

```typescript
interface IRenderer
{
    initialize(): void;

    render(scene: Scene): void;

    dispose(): void;
}
```

Everything depends on this interface.

---

# Canvas Renderer

```typescript
class CanvasRenderer
implements IRenderer
{
}
```

Uses:

```typescript
CanvasRenderingContext2D
```

Internally:

```typescript
drawImage(...)
```

---

# DOM Renderer

```typescript
class DOMRenderer
implements IRenderer
{
}
```

Uses:

```html
<div class="sprite"></div>
```

Positioning:

```css
transform:
translate(...)
rotate(...)
scale(...);
```

---

# Future WebGL Renderer

```typescript
class WebGLRenderer
implements IRenderer
{
}
```

Same interface.

No game code changes.

---

# Rendering Bridge

Instead of putting rendering information directly into the renderer, create renderable components.

```typescript
interface IRenderable
{
}
```

Examples:

```typescript
class SpriteComponent
implements IRenderable
{
}
```

Later:

```typescript
class MeshComponent
implements IRenderable
{
}
```

The renderer decides:

```typescript
if(component instanceof SpriteComponent)
```

or

```typescript
rendererFactory.create(component);
```

---

# Animation System

You mentioned:

> animation with sequences of commands

I would not make animation sprite-only.

Instead create a generic command timeline.

---

Animation Command

```typescript
interface IAnimationCommand
{
    execute(entity: Entity): void;
}
```

Examples:

```typescript
MoveCommand
RotateCommand
ScaleCommand
WaitCommand
PlaySoundCommand
ChangeSpriteCommand
```

---

Animation Sequence

```typescript
class AnimationSequence
{
    commands: IAnimationCommand[];
}
```

Example:

```text
MoveTo
Wait
Rotate
ChangeSprite
```

This becomes useful for:

* cutscenes
* enemy AI
* scripted events
* UI animations

---

# Physics Layer

Start simple.

```typescript
interface IPhysicsBody
{
}
```

Implement:

```typescript
RigidBody2D
```

Later:

```typescript
RigidBody3D
```

The PhysicsSystem uses the interface.

---

# Collision Layer

Abstract colliders.

```typescript
interface ICollider
{
}
```

Implement:

```typescript
BoxCollider
CircleCollider
PolygonCollider
```

Later:

```typescript
BoxCollider3D
SphereCollider
```

---

# Resource Management

Avoid loading assets directly inside entities.

Create:

```typescript
class AssetManager
{
    loadImage(): Promise<void>;

    getImage(id: string): HTMLImageElement;
}
```

Everything references assets by ID.

```typescript
sprite.imageId = "player";
```

---

# Dependency Injection

Instead of:

```typescript
new CanvasRenderer();
```

inject dependencies.

```typescript
class GameEngine
{
    constructor(
        private renderer: IRenderer,
        private physics: IPhysicsSystem
    )
    {}
}
```

Now switching implementations becomes:

```typescript
new GameEngine(
    new DOMRenderer(),
    new Physics2DSystem()
);
```

---

# Supporting 2D and 3D

A useful long-term design is:

```typescript
IRenderer
```

↓

```typescript
Renderer2D
Renderer3D
```

and

```typescript
Transform2D
Transform3D
```

The engine itself stays unchanged.

```text
Engine
 ├── Scene
 ├── Systems
 └── Renderer

Renderer
 ├── Canvas2D
 ├── DOM2D
 ├── WebGL2D
 └── WebGL3D
```

---

# Suggested Implementation Order

I would build the engine in this order:

### Phase 1

Core loop

```text
GameEngine
Scene
Entity
Component
System
```

### Phase 2

Rendering

```text
IRenderer
CanvasRenderer
SpriteComponent
AssetManager
```

### Phase 3

Physics

```text
PhysicsComponent
PhysicsSystem
```

### Phase 4

Collision

```text
ColliderComponent
CollisionSystem
```

### Phase 5

Animation

```text
AnimationSequence
AnimationCommands
AnimationSystem
```

### Phase 6

Renderer abstraction

```text
DOMRenderer
WebGLRenderer
```

### Phase 7

Optional ECS optimization

```text
EntityManager
ComponentStore
Query System
```

At that point you'll have a surprisingly extensible engine where the same game logic can run on Canvas, DOM elements, or eventually WebGL with almost no changes outside the rendering layer.




You're touching on a classic design debate: **"Who owns rendering knowledge?"**

There are three common approaches:

### 1. Entity renders itself

```typescript
entity.render(renderer);
```

This is common in smaller OOP engines.

### 2. Renderer knows how to render entities/components

```typescript
renderer.render(entity);
```

This is common in ECS architectures.

### 3. Entity provides rendering data, renderer strategy performs rendering

```typescript
renderer.render(renderableData);
```

This is a hybrid approach.

---

I think what you're proposing is actually closest to **#3**, even though your wording says "entity renders itself."

Consider your interface:

```typescript
interface IRenderable {
    getRenderer(): IRenderer;
    getData(): any;
}
```

The actual drawing is still performed by the renderer.

The entity is only saying:

> "For my visual representation, use this renderer strategy and this data."

That's a very different thing from:

```typescript
class Player {
    render(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(...);
    }
}
```

which would tightly couple the entity to a rendering technology.

---

## What I would change

I would avoid:

```typescript
getRenderer(): IRenderer;
```

inside the entity.

Why?

Because now your game object decides the rendering backend.

Imagine:

```typescript
player.getRenderer()
    -> SpriteRenderer
```

and later you switch from Canvas to DOM rendering.

Now every entity potentially needs to know about the switch.

That weakens your original goal:

> "single switch between rendering technologies"

---

## Alternative: Renderer Component

Instead:

```typescript
Entity
 ├─ TransformComponent
 ├─ SpriteComponent
 └─ SpriteRendererComponent
```

where:

```typescript
interface IRendererComponent
{
    render(
        data: RenderData,
        context: RenderContext
    ): void;
}
```

Then the render service becomes:

```typescript
for(const entity of renderables)
{
    const renderer = entity.getRendererComponent();

    renderer.render(
        entity.getRenderData(),
        context
    );
}
```

This is very close to your idea.

---

## Even better: RenderData + RenderStrategy

I would separate:

```typescript
SpriteComponent
```

from

```typescript
SpriteRenderer
```

Like this:

```typescript
interface IRenderData
{
}
```

```typescript
class SpriteRenderData
implements IRenderData
{
    imageId: string;
}
```

and

```typescript
interface IRenderStrategy
{
    render(
        data: IRenderData,
        transform: TransformComponent,
        context: RenderContext
    ): void;
}
```

Then:

```typescript
class SpriteRenderer
implements IRenderStrategy
{
}
```

---

## Why this becomes powerful

Imagine later:

```typescript
CanvasSpriteRenderer
DOMSpriteRenderer
WebGLSpriteRenderer
```

all implementing:

```typescript
IRenderStrategy
```

Now your entity remains unchanged:

```typescript
Player
 ├─ Transform
 └─ SpriteRenderData
```

and only the renderer factory changes:

```typescript
engine.setRendererFactory(
    new DOMRendererFactory()
);
```

or

```typescript
engine.setRendererFactory(
    new CanvasRendererFactory()
);
```

---

## One concern about `getData(): any`

I would strongly avoid `any`.

One of TypeScript's biggest advantages is type safety.

Instead:

```typescript
interface IRenderData
{
}
```

```typescript
interface IRenderable<T extends IRenderData>
{
    getRenderData(): T;
}
```

Example:

```typescript
class SpriteRenderData
implements IRenderData
{
    imageId: string;
    frame: number;
}
```

Then:

```typescript
class SpriteEntity
implements IRenderable<SpriteRenderData>
{
}
```

Now the compiler can help.

---

## A design I think fits your vision

```text
GameEngine
    |
    v
RenderService
    |
    v
Renderable Entities
    |
    +----------------+
    |                |
    v                v

Transform      RenderData
                    |
                    v

           RenderStrategy
                    |
      +-------------+-------------+
      |             |             |
      v             v             v

 CanvasSprite  DOMSprite   WebGLSprite
```

Notice:

* The engine owns the rendering backend.
* Entities own their visual description.
* Rendering logic is encapsulated in strategy objects.
* Swapping Canvas ↔ DOM ↔ WebGL becomes a configuration change.

So I agree with the core of your idea—**entities should expose rendering intent and rendering data rather than forcing a central renderer to understand every entity type**. The only part I'd reconsider is letting entities directly choose their renderer via `getRenderer()`. I'd keep renderer selection in the rendering layer and let entities provide only render data and rendering capabilities. That preserves both extensibility and backend independence.
