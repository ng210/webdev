# GLUI - UI controls with webGL

## Core (IControl)
- create from template
- create from HTML node
- bind data source
- event handlers
- render

### Create from template
- flat js object
- predefined set of properties

### Create from HTML node
- build template from HTML node
- => create from template

### Bind data source
- use data link: control's value <=> data link <=> data source

### Event handlers
- main events
  - mouse: move, over, out, click, down, up, scroll
  - keyboard: down, up, pressed
- predefined set of events

### Render
- independent of core
- support for CSS
  - colors
  - images
  - units: pixels, %
  - border
  - padding
  - margin
  - justification, alignment (vertical, horizontal)
  - font: family, size

## Presentation layer
- 2D shapes with bounding rectangle
- render with canvas 2D
- render with webGL

### Graphical features
- vertical/horizonal line
- rectangle
- text
- image

### Render with canvas 2D
Draw using basic shapes
- line => lineTo
- rectangle => fillRect
- text => fillText
- image => drawImage

### Render with webGL
Draw instances of quads (2 triangles) using shader
- line => primitive: line of 2 points
- rectangle => primitive: line of 4 points
- text => textured quad pro glyph
- image => textured quad
