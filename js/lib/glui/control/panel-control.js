import IControl from './icontrol.js'

export default class PanelControl extends IControl {
    #id = '';
    get id() { return this.#id; }

    #enableDragging = false;
    get enableDragging() { return this.#enableDragging; }
    set enableDragging(v) { this.#enableDragging = v; }

    constructor(id) {
        super();
        this.#id = id;
    }

    addHandler(eventName, handler, options) {
        
    }
}