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

---

# 🧠 Phase 7 — Scene, Assets, Scripting, Language

Scene as dynamic registry hub
External scripting via Scene API
Portability constraints (C++ / C# mindset)
Data-driven structure over framework coupling

➡️ Focus: “how do we store and organize game world data and logic?” 

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

## ADR-030 — Scene Configuration Structure

**Status:** Accepted

**Description:**  
A declarative scene format is needed to describe game content and engine configuration without JavaScript setup code.

**Decision:**  
Organize scene data into Assets, Systems, and Objects sections.

**Consequences:**

* maps directly to engine concepts
* separates resources, configuration, and scene content
* supports declarative scene loading
* allows future extension without changing the top-level structure
* provides a stable foundation for scripting and behavior configuration