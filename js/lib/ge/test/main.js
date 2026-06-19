import GameEngine from '../game-engine.js'
import GameObject from '../game-object.js'
import Scene from '../scene.js'

import PresentationSystem from '../systems/presentation/presentation-system.js'
import PresentationFeature from '../systems/presentation/presentation-feature.js'

import HtmlRenderer from '../renderer/html-renderer.js'

import VisualFactory from '../systems/presentation/visuals/visual-factory.js'
import TextVisual from '../systems/presentation/visuals/text-visual.js'
import RectVisual from '../systems/presentation/visuals/rect-visual.js'

class TestObject extends GameObject {
    constructor(id) {
        super(id)
    }
}

// ---------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------
const root = document.getElementById('game')
const renderer = new HtmlRenderer(root)

// ---------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------
const scene = new Scene()

// ---------------------------------------------------------------------
// Test object
// ---------------------------------------------------------------------
const presentation = new PresentationFeature()

const textVisual = VisualFactory.create(TextVisual, {
        id: 'helloText', x: 50, y: 50,
        text: 'Hello Engine!', isVisible: true})
presentation.visuals.push(textVisual)

const rectVisual = VisualFactory.create(RectVisual, {
        id: 'testRect', x: 100, y: 100,
        width: 200, height: 100, isVisible: true})
presentation.visuals.push(rectVisual)

const object = new TestObject('object1')
object.addFeature(PresentationSystem, presentation)
scene.register(object)

// ---------------------------------------------------------------------
// Systems
// ---------------------------------------------------------------------
const presentationSystem = new PresentationSystem()

// ---------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------
const engine = new GameEngine(renderer, scene)
engine.addSystem(presentationSystem)
engine.start()

// ---------------------------------------------------------------------
// Test animations
// ---------------------------------------------------------------------

let dx = 2
setInterval(() => {
    rectVisual.x += dx

    if (
        rectVisual.x > 500 ||
        rectVisual.x < 100
    ) {
        dx = -dx
    }
}, 16)

// Visibility test
setTimeout(() => { textVisual.isVisible = false }, 3000)
setTimeout(() => { textVisual.isVisible = true }, 6000)