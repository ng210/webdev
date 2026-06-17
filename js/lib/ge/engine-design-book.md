# 📘 Browser Game Engine Design Book (Draft v1)

## From ECS intuition to a descriptor-driven rendering architecture

---

# 1. Introduction

This document describes the evolution of a browser-based game engine architecture developed iteratively through design exploration.

The original goal was not to build a production engine, but to investigate:

* how far ECS patterns can be pushed in JavaScript
* how rendering abstraction should be structured in a multi-backend system
* how to maintain portability toward C++ / C# architectures
* how to avoid over-engineering while still keeping extensibility

The architecture evolved through repeated refinement of assumptions, where each stage exposed limitations in the previous one.

Instead of designing a final architecture upfront, the system emerged through a sequence of **architecture decisions (ADRs)**.

---

# 2. Core Execution Model — GameEngine

The GameEngine is the root orchestrator of the system. It does not own game logic or rendering logic; instead, it coordinates execution flow.

### Responsibilities:

* system lifecycle management
* update loop timing
* render pipeline delegation
* scene initialization and shutdown coordination

---

## ADR-011 — GameEngine as execution coordinator only

### Status

Accepted

### Context

Initial design treated GameEngine as a monolithic controller combining:

* ECS execution
* rendering logic
* scene ownership

This created excessive coupling and made the engine difficult to reason about.

### Decision

GameEngine is reduced to a minimal orchestration layer:

* runs update loop
* calls systems
* delegates rendering

It does NOT interpret game state or perform rendering itself.

### Consequences

* improved modularity
* easier system injection
* clearer lifecycle boundaries

---

# 3. Scene — Dynamic Registry System

The Scene evolved away from a static “world container” into a dynamic registry hub.

Instead of assuming fixed categories of objects, the Scene maintains:

* GameObject storage
* system-specific registries
* asset storage
* lookup APIs

---

## ADR-012 — Scene as registry hub instead of world model

### Status

Accepted

### Context

A static Scene model assumes a fixed structure of entities and relationships.

However, different systems require different subsets of objects:

* physics needs physical objects
* animation needs animatable objects
* renderer needs visual objects

A single fixed structure cannot represent all views efficiently.

### Decision

Scene becomes a dynamic registry system:

* stores GameObjects
* maps objects into system-specific registries
* does not define object categories itself

### Consequences

* systems can be added dynamically
* no hardcoded world structure
* flexible runtime composition

---

# 4. GameObject — Feature-Based Composition Model

GameObjects represent runtime entities in the engine.

Instead of inheritance hierarchies, behavior is defined through **features**.

---

## ADR-013 — Feature-based GameObject model

### Status

Accepted

### Context

Inheritance chains like:

```
GameObject → Actor → Player → NPC
```

quickly become rigid and difficult to extend.

### Decision

Replace inheritance with feature-based composition:

* each GameObject has a `features` map
* features represent participation in systems
* systems operate on feature data

### Consequences

* instance-level flexibility
* no class explosion
* systems become data-driven

### Alternatives considered

* classical inheritance (rejected: rigid)
* hybrid inheritance + components (rejected: inconsistent model)

---

# 5. System Model — Execution Units of Simulation

Systems represent simulation logic in the engine:

* PhysicsSystem
* AnimationSystem
* InputSystem
* CollisionSystem

Each system processes only the objects relevant to it via features.

---

## ADR-016 — Systems operate on feature-based selection

### Status

Accepted

### Context

Early ECS design assumed systems iterate over all entities and filter them at runtime.

This leads to:

* unnecessary iteration
* runtime branching (`if (entity.physics)`)

### Decision

Systems only operate on objects explicitly registered via features.

Scene maintains system-specific registries.

### Consequences

* no runtime filtering overhead
* deterministic system inputs
* cleaner execution model

---

# 6. Rendering System — A Separate Domain

Rendering does not behave like a simulation system.

It requires:

* different abstraction level
* backend-specific implementations
* retained state (DOM / GPU buffers)

This led to a dedicated rendering architecture.

---

## ADR-001 — Separation of Rendering from ECS Systems

### Status

Accepted

### Decision

Rendering is NOT part of ECS systems.
It is a separate pipeline consuming visual data.

---

## ADR-002 — Introduction of Visual Abstraction Layer

### Status

Accepted

### Decision

Introduce Visual objects:

* ImageVisual
* TextVisual
* RectVisual

These are renderer-agnostic representations of presentation data.

---

## ADR-003 — Removal of RenderCommand Pipeline

### Status

Rejected

### Decision

RenderCommand abstraction was removed due to:

* lifecycle complexity
* unnecessary indirection
* GC overhead in JS

---

## ADR-006 — Descriptor-Based Rendering Model

### Status

Accepted

### Decision

Use VisualDescriptors:

```js
Visual → { tagName, renderMethod }
```

### Consequences

* no switch statements
* no inheritance-based rendering
* extensible renderer design

---

## ADR-007 — Renderer-Owned State Model

### Status

Accepted

### Decision

Renderer maintains:

```js
#visualStates: Map<id, { element, visible }>
```

### Consequences

* DOM state is isolated from game state
* enables efficient updates

---

## ADR-008 — Visibility Diffing Optimization

### Status

Accepted

### Decision

Only update DOM visibility when state changes.

---

## ADR-009 — HTML Renderer Retained-State Model

### Status

Accepted

### Decision

HTML renderer operates in retained mode:

* keeps DOM elements alive
* updates incrementally

---

# 7. Language Choice — JavaScript vs TypeScript

The engine deliberately avoids TypeScript in early stages.

---

## ADR-014 — Choice of JavaScript over TypeScript

### Status

Accepted

### Context

TypeScript provides:

* static typing
* safer refactoring
* better tooling

However, early-stage architectural exploration requires:

* fast iteration
* minimal tooling overhead
* flexibility in design changes

### Decision

Use pure JavaScript.

### Consequences

* faster prototyping
* less tooling friction
* reduced compile-time guarantees

---

# 8. Portability Design — Toward C++ / C#

The architecture is intentionally designed to remain portable.

---

## ADR-015 — Portability-first architecture constraints

### Status

Accepted

### Context

Future implementations may target:

* C++
* C#
* other statically typed engines

### Decision

Avoid JavaScript-specific patterns:

* use explicit Maps instead of dynamic typing tricks
* avoid hidden prototype behavior
* use constructor-based type mapping

### Consequences

* easier translation to static languages
* clearer architectural structure

---

# 9. Input System (Missing Piece)

Input handling is treated as a system-level concern, but separated from core simulation.

---

## ADR-017 — Input as a system, not engine core logic

### Status

Accepted

### Context

Input handling was initially considered part of GameEngine.

This leads to coupling issues:

* engine becomes platform-dependent
* input logic mixes with orchestration

### Decision

Input is implemented as a system (InputSystem):

* processes raw input events
* updates features on GameObjects

### Consequences

* platform independence
* clean separation of concerns

---

# 10. Asset System (Scene responsibility extension)

---

## ADR-018 — Scene as asset and object registry

### Status

Accepted

### Decision

Scene manages:

* GameObjects
* assets
* system registries

Assets are not global; they are scoped to Scene.

### Consequences

* supports multiple scenes
* avoids global state pollution

---

# 11. Scripting Model (Future integration)

---

## ADR-019 — Scene-driven scripting API

### Status

Proposed

### Context

Future requirement: external scripting interface for scene definition.

### Decision direction

Scene exposes:

* `register()`
* `addAsset()`
* object creation APIs

Scripting layer will operate through Scene only.

### Consequences

* engine core remains unchanged
* scripting becomes a thin layer

---

# 12. Current Architecture Snapshot

```txt
GameEngine
  → Scene
      → GameObjects (feature-based)
      → Assets
      → System registries
  → Systems
      → Physics
      → Animation
      → Input
  → Renderer (HtmlRenderer)
      → VisualDescriptors
      → VisualStates
      → DOM
```

---

# 13. Core Design Principles

Across all ADRs, the following principles emerged:

### 1. Composition over inheritance

GameObjects are feature-based, not hierarchical.

### 2. Data-driven systems

Systems interpret data, not object hierarchies.

### 3. Explicit mapping over implicit typing

Constructor-based maps replace string-based or dynamic dispatch.

### 4. Renderer is stateful, not stateless

DOM/GPU state must be tracked explicitly.

### 5. Separation of concerns is strict

Each layer has one responsibility:

* Engine → orchestration
* Scene → registry
* Systems → simulation
* Renderer → presentation

---

# 14. Conclusion

The final architecture is not the result of a single design decision, but the outcome of iterative refinement.

Key insight:

> Game engine architecture is not designed — it is discovered by eliminating incorrect abstractions.

What remains is a system that is:

* modular
* extensible
* portable
* and grounded in practical JavaScript constraints
