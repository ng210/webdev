# Shader-Audio
A project to utilize the GPU's shader to generate sounds and music.

## Modules
1st phase
- State Management
- GPU Communication
- Sound Playback
- Sequencer
2nd phase
- UI for controls
- Code editor
- Node editor

## State management
- gfx state: input buffers, uniforms, shader programs, render targets
- sequence state: playback position
- control state: sound control values - data bind

## GPU Communication
- create/destroy GPU objects
  - targets: framebuffer, renderbuffer
  - shaders: compile, link and set program
  - textures: create, load, set texture
  - uniforms: set and link shader parameters
  - drawcall

## Sound playback
 - playback using callbacks

## Sequencer
 - uses Player module
 - can support a simple script

## Main loop
- process sequence events
- update global gpu data: uniforms, buffers
- upload modified global data
- for each pass
  - upload data
  - run shader
  - swap buffers
- process data

Passes are ordered by
- shader
- uniform

## Pass
Components
- Shader
- Buffers
  - uniforms
  - samples
  - render

Pass.render
- foreach buffer
  - if buffer.changed upload(buffer)
  - if prg != state.prg set(prg)
