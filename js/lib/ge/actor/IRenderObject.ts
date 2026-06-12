import Vec2 from '../../math/vec2.js'

export default interface IRenderObject {
    getPosition():Vec2 
    getRotation():Vec2
    getScale():Vec2

    render(ts:number):void
}