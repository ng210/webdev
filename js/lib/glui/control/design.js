import { implement } from '/js/lib/util.js'

class IControl {
    get id() { throw new Error('Not implemented!'); }
    addHandler(eventName, handler, options) { throw new Error('Not implemented!'); }
}

class HtmlControl extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {}

    disconnectedCallback() {}

    baka() {}
}

implement(HtmlControl, IControl);
window.customElements.define('html-control', HtmlControl);

class WebglControl {

}

class RangeHtmlControl extends HtmlControl {
    constructor() {
        super();
        debugger
    }
}

window.customElements.define('range-control', RangeHtmlControl);

class RangeWebglControl extends WebglControl {

}

export { HtmlControl, RangeHtmlControl };




class Control {
  id, value
  uiElement
  dataSource, validEvents
  
  constructor(id, data)
  dataBing(dataSource)
  async initialize(data)
  addHandler(event, handler)
}

class UiElement {
  control, parent
  
  constructor(ctrl)
  update(frame, dt)
  render(frame, dt)
  addHandler(event, handler)
}

class HtmlElement extends UiElement {
  elem
  
  constructor(id, data)
  update(frame, dt)
  render(frame, dt)
  createElement()
}

class RangeControl extends Control {
  min, max, step
}

class HtmlRangeElement extends UiElement{
  
  constructor(ctrl)
  
}

let ctrl1 = new RangeControl('ctrl1')
ctrl1.dataBind(
  { min:0, max:100,step:1,value:10 })
ctrl1.uiElement = new HtmlRangeElement(ctrl1)
ctrl1.update(0, 0)
ctrl1.render(0, 0)