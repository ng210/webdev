# Browser-based Game Engine Design Book

# 🧭 Phase 0 — Language choice

Language selection
Portability considerations

➡️ Focus: “how do we keep implementation simple and yet portable?”

## ADR-p01 — JavaScript over TypeScript

**Status:** Accepted

**Description:**
Language choice for engine.

**Decision:**
Use pure JavaScript.

**Consequences:**

* faster iteration
* less tooling overhead

---

## ADR-p02 — Portability-first design

**Status:** Accepted

**Description:**
Design for C++ / C# portability.

**Decision:**
Avoid JS-specific constructs.

**Consequences:**

* easier translation
* more disciplined architecture


# 🧭 Phase 1 — Engine Skeleton (Execution + World Model)

GameEngine loop
Scene concept
GameObject model

➡️ Focus: “how does the engine run and store things?”

---

## ADR-001 — GameEngine as execution coordinator

**Status:** Accepted

**Description:**
Initial design treated GameEngine as a central controller responsible for systems, scene, and rendering.

**Decision:**
Reduce GameEngine to orchestration only: update loop + system lifecycle.

**Consequences:**

* clearer separation of responsibilities
* systems become modular
* engine becomes replaceable

---

## ADR-002 — Scene as world container

**Status:** Rejected → evolved

**Description:**
Scene originally considered a static entity container.

**Decision:**
Replace static world model with dynamic Scene structure.

**Consequences:**

* enabled later registry-based design
* removed rigid world assumptions

---

## ADR-023 — Scene as dynamic registry hub

**Status:** Accepted

**Description:**
Scene is not a world model but registry manager.

**Decision:**
Scene dynamically builds system registries.

**Consequences:**

* flexible architecture
* supports runtime systems

---

## ADR-024 — Asset system belongs to Scene

**Status:** Accepted

**Description:**
Where assets should be stored.

**Decision:**
Assets are Scene-scoped.

**Consequences:**

* supports multiple scenes
* avoids global state

---

## ADR-025 — Scene-based scripting API

**Status:** Proposed

**Description:**
External scripts control scenes.

**Decision:**
Expose Scene as scripting interface.

**Consequences:**

* engine decoupled from game logic
* future modding support

---

## ADR-003 — GameObject inheritance model

**Status:** Rejected

**Description:**
Class hierarchy like GameObject → Actor → Player.

**Decision:**
Abandon inheritance-heavy design.

**Consequences:**

* removed rigid type trees
* enabled composition approach

---

---

# ⚙️ Phase 2 — System Thinking (ECS exploration)

Systems
Physics / Animation / Input ideas
how objects participate in systems

➡️ Focus: “how does simulation work?”

---

## ADR-004 — Systems process entity subsets

**Status:** Accepted

**Description:**
Systems operate only on relevant objects (physics, animation, input).

**Decision:**
Introduce system-based processing model.

**Consequences:**

* clearer simulation separation
* foundation for feature-based model

---

## ADR-005 — System filtering via runtime checks

**Status:** Rejected

**Description:**
Systems check `if (entity.physics)` during iteration.

**Decision:**
Avoid runtime filtering inside loops.

**Consequences:**

* removed performance overhead
* pushed filtering to registration stage

---

## ADR-006 — System acceptance function (system.accept)

**Status:** Rejected

**Description:**
Systems define `accept(entity)`.

**Decision:**
Replace with feature-based registration.

**Consequences:**

* simpler architecture
* fewer runtime checks

---

---

# 🧬 Phase 3 — Feature-Based Model

GameObject → features
removal of strict ECS filtering
Scene registries per system

➡️ Focus: “how do systems actually get data?”

---

## ADR-007 — Feature-based GameObject model

**Status:** Accepted

**Description:**
Replace inheritance and capabilities with features.

**Decision:**
GameObject stores system features in a map.

**Consequences:**

* flexible per-instance composition
* supports multiple system participation

---

## ADR-008 — Scene system registries

**Status:** Accepted

**Description:**
Scene maintains per-system object collections.

**Decision:**

```js id="scene_reg"
Map<SystemClass, GameObject[]>
```

**Consequences:**

* efficient system iteration
* dynamic system support

---

## ADR-009 — participatesIn vs features

**Status:** Rejected → refined

**Description:**
Objects explicitly list participating systems.

**Decision:**
Replace participation list with features.

**Consequences:**
* single source of truth
* reduced duplication

---

---

# 🎨 Phase 4 — Early Rendering Attempts (RenderCommand era)

Rendering as a separate concern
RenderCommand idea (early version)
then rejected it

➡️ Focus: “how do we display things?”

---

## ADR-010 — RenderCommand abstraction layer

**Status:** Rejected

**Description:**
Presentation generates RenderCommands consumed by renderer.

**Decision:**
Remove RenderCommand system entirely.

**Consequences:**

* simplified rendering model
* reduced GC pressure
* removed unnecessary indirection

---

## ADR-011 — Persistent RenderCommands

**Status:** Rejected

**Description:**
RenderCommands created once and toggled active/inactive.

**Decision:**
Abandon persistent render command model.

**Consequences:**

* removed lifecycle complexity
* simplified presentation logic

---

## ADR-012 — Presentation generates RenderCommands

**Status:** Rejected

**Description:**
Presentation layer directly outputs RenderCommands.

**Decision:**
Introduce Visual abstraction instead.

**Consequences:**

* renderer independence restored
* cleaner abstraction layer

---

---

# 🧾 Phase 5 — Visual Abstraction Model

Visuals (ImageVisual, TextVisual, RectVisual)
PresentationSystem
Renderer separation

➡️ Focus: “how do we decouple game state from rendering backend?”

---

## ADR-013 — Visual abstraction layer

**Status:** Accepted

**Description:**
Introduce renderer-agnostic visual definitions.

**Decision:**
Use Visual classes (ImageVisual, TextVisual, RectVisual).

**Consequences:**

* decoupled rendering backend
* stable presentation format

---

## ADR-014 — Composite visuals (Button, UI elements)

**Status:** Accepted

**Description:**
Support high-level UI visuals.

**Decision:**
Allow composite visuals like ButtonVisual.

**Consequences:**

* better UI expressiveness
* renderer-dependent expansion possible

---

## ADR-015 — Composite expansion responsibility

**Status:** Accepted

**Description:**
Where composite visuals are decomposed.

**Decision:**
Renderer is responsible for expansion.

**Consequences:**

* presentation stays abstract
* renderer gains flexibility

---

---

# 🖼️ Phase 6 — Presentation & Renderer Architecture

PresentationSystem owns visuals
Renderer is backend-only
VisualState retained in renderer
HTML renderer implementation

➡️ Focus: “how do we implement efficient rendering in JS?”

---

## ADR-016 — PresentationSystem introduction

**Status:** Accepted

**Description:**
Introduce PresentationSystem to manage visuals.

**Decision:**
PresentationSystem translates features → visuals.

**Consequences:**

* clean separation from simulation systems
* structured rendering pipeline

---

## ADR-017 — Renderer is NOT a system

**Status:** Accepted

**Description:**
Renderer should not be part of ECS system loop.

**Decision:**
Renderer becomes owned by PresentationSystem.

**Consequences:**

* correct architectural layering
* renderer specialization possible

---

## ADR-018 — Renderer ownership hierarchy

**Status:** Accepted

**Description:**
Define final rendering ownership model.

**Decision:**

```txt id="renderer_h"
PresentationSystem
  → Renderer
```

**Consequences:**

* renderer fully decoupled from engine
* presentation controls rendering lifecycle

---

## ADR-019 — HTML renderer retained state model

**Status:** Accepted

**Description:**
DOM elements must persist between frames.

**Decision:**
Renderer stores visual state (DOM elements + visibility).

**Consequences:**

* efficient DOM updates
* avoids re-creation overhead

---

## ADR-020 — Visual state vs element separation

**Status:** Rejected → merged

**Description:**
Separate element storage and visual state tracking.

**Decision:**
Merge into single state object.

**Consequences:**

* simpler renderer implementation
* fewer lookups

---

## ADR-021 — Visibility diffing optimization

**Status:** Accepted

**Description:**
Avoid unnecessary DOM updates.

**Decision:**
Track previous visibility state.

**Consequences:**
* reduced DOM writes
* improved performance

---

## ADR-022 — Descriptor-based rendering dispatch

**Status:** Accepted

**Description:**
Render dispatch mechanism.

**Decision:**
Use constructor-based Map:

```js id="render_map"
Map(VisualClass → { tagName, renderMethod })
```

**Consequences:**

* fast lookup
* no switch statements

---

# 🧠 Phase 7 — Fixes and changes

  Adding a VisualFactory
  Ownership of Renderer

## ADR-028 — VisualFactory for Safe Initialization

**Status:** Accepted

**Description:**  
FeatureData assignment in the base constructor caused initialization-order problems in derived classes.

**Decision:**  
Introduce a `VisualFactory` that creates and initializes visual instances after construction.

**Consequences:**
* correct initialization order
* no constructor boilerplate in Visual subclasses
* centralized creation and validation
* supports future pooling and serialization
* portable to C++ and C#

---

## ADR-029 — Renderer Ownership and Placement

**Status:** Rejected

**Description:**  
The architecture considered placing the Renderer under the PresentationSystem because both participate in rendering.

**Decision:**  
Keep the Renderer and PresentationSystem as separate components owned by the GameEngine.

**Consequences:**
* clear separation of responsibilities
* PresentationSystem produces visuals only
* Renderer performs rendering only
* rendering backends remain interchangeable
* GameEngine coordinates the rendering pipeline

**Considered Alternative:**
```txt
GameEngine
 └─ PresentationSystem
      └─ Renderer
```

# 📜 Phase 8 — Scene loading

 Configuration Architecture
 Type registration
 Asset Manager
 Systems
 Objects & Features
 SceneLoader

## ADR-030 — Scene Configuration Structure

**Status:** Accepted

**Description:**  
A declarative scene format is needed to describe game content and engine configuration without JavaScript setup code.

**Decision:**  
Organize scene data into Engine, Assets, Systems, and Objects sections.

**Consequences:**
* maps directly to engine concepts
* separates resources, configuration, and scene content
* supports declarative scene loading
* allows future extension without changing the top-level structure
* provides a stable foundation for scripting and behavior configuration

---

## ADR-031 — Open Engine Extension Model

**Status:** Rejected → refined in ADR-041

**Description:**  
The engine must support extending its functionality without modifying the engine source code.

**Decision:**  
Allow user-defined Assets, Features, Systems, and GameObjects through external modules and type registration.

**Consequences:**
* supports plugins and project-specific extensions
* custom behavior, features, systems, and objects can be implemented outside the engine
* requires type registration and lookup mechanisms
* scene loading cannot rely on hard-coded type switches
* increases loader complexity
* improves portability to C++ (shared libraries) and C# (assemblies)

**Notes:**
Built-in engine types and user-defined types are treated uniformly by the configuration system.

Example:

```yaml
assets:
  aiLib: scripts/ai.js

systems:
  enemyAi:
    type: EnemyAiSystem
    module: aiLib

objects:
  - id: enemy1
    type: EnemyObject
    module: aiLib
```

---

## ADR-032 — Asset References and Resource Normalization

**Status:** Accepted

**Description:**  
Resources may be referenced directly in configuration or declared explicitly as named assets.

**Decision:**  
Allow both direct resource references and explicit asset declarations; the loader normalizes both into assets managed by the AssetManager.

**Consequences:**
* concise configuration for one-off resources
* reusable resources can be declared as named assets
* unified runtime asset model
* supports future caching, metadata, and hot reloading
* loader performs resource normalization during scene loading

**Examples:**
Explicit asset:

```yaml
assets:
  clickSound: sounds/click.wav
systems:
  sound:
    effects:
      click: clickSound
      accept: sounds/accept.wav
      
systems:
  sound:
```

---

## ADR-033 — Scene File Format

**Status:** Accepted

**Description:**  
A scene description format is required for declarative engine configuration and scene loading.

**Decision:**  
Use JSON as the implementation format. YAML-like notation may be used in design discussions and documentation.

**Consequences:**
* no external parser dependencies
* native support in JavaScript environments
* good portability to C++ and C#
* scene files can be loaded directly into JavaScript objects
* documentation examples may use a more concise YAML style for readability

---

## ADR-034 — Asset Reference Syntax

**Status:** Superseded by ADR-038

**Description:**
Scene configuration must distinguish between literal values, direct resources, and references to registered assets.

**Decision:**
Use a `ref` property inside an object to represent asset references. Primitive values are interpreted as literals or direct resources.

**Consequences:**
* keeps configuration pure JSON
* avoids special string syntax
* references are explicit and self-describing
* supports future extension of reference metadata
* simplifies parsing and portability

**Examples:**
Literal:

```json
{
  "sound": {
    "initialVolume": 2
    "effects": {
      "click2": {
          "ref": "sfx-click1",
          "optional": true
      }
    }
  }
}
```

---

## ADR-035 — Type Resolution by Alias

**Status:** Accepted

**Description:**  
Scene configuration must reference engine and user-defined types in a stable and portable way.

**Decision:**  
Use registered aliases instead of implementation class names.

**Consequences:**
* configuration is independent of implementation details
* classes may be renamed without affecting scene files
* built-in and user-defined types are resolved uniformly
* supports plugin and module-based extension
* requires type registries for type lookup

**Examples:**

Registration:

```js
RendererRegistry.register('html', HtmlRenderer)

FeatureRegistry.register(
    'presentation',
    PresentationFeature
)
```

---

## ADR-036 — Asset Model (Identity, Type, Ownership)

**Status:** Accepted

**Description:**  
Defines the structural model of assets within the engine, including identity, typing, and ownership responsibilities.

**Decision:**  
Assets have string-based identities (explicit or generated), are strongly typed via a base `Asset` class with derived types, and are exclusively owned by the `AssetManager`.

**Consequences:**
- Assets have a unified identifier namespace (explicit or generated)
- AssetManager is the single owner of all assets (full lifecycle responsibility)
- Enables CRUD operations on assets through AssetManager
- Supports a strongly typed asset hierarchy (e.g. ImageAsset, AudioAsset)
- Improves portability to strongly typed OOP languages (C++, C#)

**Examples:**
Explicit and implicit identity:

```json
{
  "clickSound": "sounds/click.wav"
}
```

```javascript
class Asset {
    constructor(id) {
        this.id = id
    }
}

class ImageAsset extends Asset {}
class AudioAsset extends Asset {}
```

---

## ADR-037 — Asset Loading & Normalization Strategy

**Status:** Accepted

**Description:**  
Defines how assets are loaded into the engine and how raw configuration values are transformed into managed assets.

**Decision:**  
Use eager loading for all assets and normalize all direct resource references and explicit asset declarations into AssetManager-managed assets.

**Consequences:**
- All assets are loaded at scene initialization (eager loading)
- Direct resource references are automatically converted into assets
- Explicit assets and implicit resources share a unified runtime representation
- AssetManager acts as the normalization boundary
- Simplifies SceneLoader by centralizing asset creation logic

**Examples:**

Explicit asset:

```json
{
  "assets": {
    "clickSound": "sounds/click.wav"
  }
}
```

---

## ADR-038 — Asset Declaration and Reference Syntax

**Status:** Accepted

**Description:**  
Scene configuration must support both referencing existing assets and declaring assets inline at the point of use.

**Decision:**  
String values are interpreted as references to existing assets. Object values containing asset metadata are interpreted as asset declarations and result in the creation of a new asset.

**Consequences:**
* asset references use a compact syntax
* inline asset declarations are supported
* asset usage is consistent with the alias-based type system
* SceneLoader is responsible for interpreting configuration values
* AssetManager remains responsible only for asset storage and lifecycle management

**Examples:**
Reference an existing asset:
```json
{
  "sound": {
    "click": "clickSound"
  }
}
```

Declare an asset inline:
```json
{
  "sound": {
    "click": {
      "id": "clickSound",
      "type": "audio",
      "source": "sounds/click.wav"
    }
  }
}
```

Implicit identifier generation:
```json
{
  "sound": {
    "click": {
      "type": "audio",
      "source": "sounds/click.wav"
    }
  }
}
```

---

## ADR-039 — Forward Asset References

**Status:** Accepted

**Description:**  
Asset references should be independent of declaration order within scene configuration.

**Decision:**  
Support forward asset references through a multi-phase loading process. Asset declarations are collected before asset references are resolved.

**Consequences:**
* configuration order does not affect meaning
* assets may be referenced before their declaration
* asset-to-asset references become possible
* SceneLoader requires multiple loading phases
* improves flexibility for scene authors

**Example:**
```json
{
  "systems": {
    "sound": {
      "click": "clickSound"
    }
  },

  "assets": {
    "clickSound": {
      "type": "audio",
      "source": "sounds/click.wav"
    }
  }
}
```

---

## ADR-040 — Asset Declaration Schema

**Status:** Accepted

**Description:**  
Assets require a standardized configuration format that supports both built-in and custom asset types.

**Decision:**  
Assets are declared using an object containing a mandatory `type` property, an optional `id`, a mandatory resource location (`path` or `url`), and an optional `properties` object for type-specific settings.

**Consequences:**
* asset declarations have a uniform structure
* asset identifiers may be generated automatically
* asset types are referenced by aliases
* local and remote resources are distinguished explicitly
* asset types may define custom configuration through `properties`

**Examples:**

Local resource:
```json
{
  "id": "playerImage",
  "type": "image",
  "path": "images/player.png"
}
```

Remote resource:
```json
{
  "id": "remoteConfig",
  "type": "json",
  "url": "https://example.com/config.json"
}
```

Type-specific properties:
```json
{
  "id": "backgroundMusic",
  "type": "audio",
  "path": "music.ogg",
  "properties": {
    "loop": true,
    "volume": 0.5
  }
}
```

---

## ADR-041 — True Engine Extension Points

**Status:** Accepted, refines ADR-031

**Description:**  
The engine must support runtime extension without requiring modifications to its core implementation. Extension points should correspond only to concepts that introduce new behavior or new data processing capabilities.

**Decision:**  
The engine supports two extensible models: Asset Types and System-Feature Types. GameObjects remain generic containers and are not extensible through subclassing.

**Consequences:**
* asset types may be added through extensions
* system-feature pairs may be added through extensions
* GameObject remains a generic data container
* object specialization is achieved through feature composition
* extension loading must populate AssetRegistry and SystemRegistry
* the engine core remains independent of concrete asset and system implementations

**Examples:**

Generic object:
```json
{
  "objects": {
    "player": {
      "presentation": { },
      "health": { },
      "inventory": { }
    }
  }
}
```

Custom asset type:
```json
{
  "assets": {
    "level1": {
      "type": "tilemap",
      "path": "maps/level1.json"
    }
  }
}
```

Custom system-feature type:
```json
{
  "systems": {
    "inventory": { }
  },

  "objects": {
    "player": {
      "inventory": {
        "capacity": 20
      }
    }
  }
}
```

---

