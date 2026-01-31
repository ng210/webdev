export default class View {
    #control;
    get control() {
        return this.#control;
    }

    get parent() {
        return this.#control?.parent?.view ?? null;
    }

    #element;
    get element() { return this.#element; }
    set element(v) {
        this.#element = v;
        if (v) {
            v._view = this;
        }        
    }

    constructor() { }

    // Called when the view is attached to its Control.
    // Allocate and load resources (DOM nodes, GPU buffers)
    async onAttach(control) {
        this.#control = control;
        this.element.id = this.control.id;
        // Default: do nothing
    }

    // Called when the view is detached from its Control.
    // Clean up dynamic resources (DOM nodes, GPU buffers, event listeners).
    async onDetach() {
        this.unbindEvents();
        this.#control = null;
    }

    // Update the internal state from the Control. Override in subclasses.
    update() {
        // Default: do nothing
    }

    // Render the view using already initialized resources.
    render(context, dt, frame) {
        throw new Error("render() must be implemented by subclass");
    }

    addEventHandler(eventName, handler, canPropagate = false) {
        throw new Error("addEventHandler() must be implemented by subclass");
    }

    removeEventHandler(eventName, handler) {
        throw new Error("removeEventHandler() must be implemented by subclass");
    }

    // Bind UI events to the Control (optional).
    bindEvents() {
        for (let eventName of this.control.supportedEvents) {
            this.addEventHandler(eventName, View.dispatchEvent);
        }
    }

    unbindEvents() {
        for (let eventName of this.control.supportedEvents) {
            this.removeEventHandler(eventName, View.dispatchEvent);
        }
    }

    static dispatchEvent(event) {
        let ctrl = event.target;
        if (ctrl) {
            ctrl.trigger(event);
        }
    }

    static dispatchEvent(event) {
        let ctrl = event.target;
        if (ctrl && !ctrl.suppressedEvents.includes(event.type)) {
            ctrl.trigger(event);
        }
    }


    applyVisual(prop, value) {
        throw new Error("applyVisual must be implemented by subclass");
    }

    applyVisuals(visuals) {
        for (let [k, v] of Object.entries(visuals)) {
            this.applyVisual(k, v);
        }
    }

    addVisualClass(className) {
        throw new Error("addVisualClass must be implemented by subclass");
    }
    removeVisualClass(className) {
        throw new Error("removeVisualClass must be implemented by subclass");
    }

    setPointerCapture(event) {
        throw new Error("removeVisualClass must be implemented by subclass");
    }
    releasePointerCapture(event) {
        throw new Error("removeVisualClass must be implemented by subclass");
    }
}
