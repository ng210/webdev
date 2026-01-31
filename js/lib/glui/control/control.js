// Base Control class
export default class Control {
    static #supportedEvents = ['click', 'pointermove' ,'pointerenter', 'pointerleave'];
    get supportedEvents() { return [...Control.#supportedEvents]; }
    static #suppressedEvents = [];
    suppressedEvents = [...Control.#suppressedEvents];

    #id;
    get id() { return this.#id; }
    set id(newId) { this.#id = newId; }

    #parent;
    get parent() { return this.#parent; }
    set parent(ctrl) { this.#parent = ctrl; }

    #view;
    get view() { return this.#view; }
    async setView(v) {
        const oldView = this.#view;
        const newView = v || null;

        try {
            if (oldView?.onDetach) {
                await oldView.onDetach();
            }
            this.#view = newView;
            if (newView) {
                await newView.onAttach(this);
                newView.initVisuals(this.#visuals);
                this.#prevVisuals = { ...this.#visuals };
                newView.bindEvents();
            }
        } catch (err) {
            console.error("View change failed:", err);
        }

        return oldView;
    }

    #position = { x: 0, y: 0 };
    get position() { return { ...this.#position }; }
    setPosition(x, y) {
        this.#position.x = x;
        this.#position.y = y;
        this.#view?.applyVisual('left', this.#position.x);
        this.#view?.applyVisual('top', this.#position.y);
    }
    #width = 0;
    get width() { return this.#width; }
    set width(v) {
        this.#width = v;
        this.#view?.applyVisual('width', v);
    }
    #height = 0;
    get height() { return this.#height; }
    set height(v) {
        this.#height = v;
        this.#view?.applyVisual('height', v);
    }

    move(dx, dy) {
        this.#position.x += dx;
        this.#view?.applyVisual('left', this.#position.x);
        this.#position.y += dy;
        this.#view?.applyVisual('top', this.#position.y);
    }

    #capturePoint = null;
    setPointerCapture(event) {
        // set to current pointer position
        this.#capturePoint = { x: event.x, y: event.y };
        this.view.setPointerCapture(event);
        return true;
    }

    releasePointerCapture(event) {
        this.#capturePoint = null;
        this.view.setPointerCapture(event);
        return true;
    }

    #isDragging = false;
    #lastDragPoint = null;
    #dragOffset = null;
    startDragging(event) {
        this.#isDragging = true;
        this.#lastDragPoint = { x: event.x, y: event.y };
        this.#dragOffset = {
            x: event.x - this.#position.x,
            y: event.y - this.#position.y
        };
        this.on('pointermove', this.doDragging, this);
        this.setPointerCapture(event);
        return false;
    }

    doDragging(event) {
        if (this.#isDragging) {
            event.x = event.x - this.#dragOffset.x;
            event.y = event.y - this.#dragOffset.y;
            event.offsetX = event.x - this.#capturePoint.x;
            event.offsetY = event.y - this.#capturePoint.y;
            event.deltaX = event.x - this.#lastDragPoint.x;
            event.deltaY = event.y - this.#lastDragPoint.y;
            this.#lastDragPoint.x = event.x;
            this.#lastDragPoint.y = event.y;
            event.type = 'dragging';
            this.trigger(event);
        }
    }

    stopDragging(event) {
        this.#isDragging = false;
        this.off('pointermove', this.doDragging);
        this.releasePointerCapture(event);
        return false;
    }

    addDragging() {
        this.on('pointerdown', this.startDragging, this);
        this.on('pointerup', this.stopDragging, this);
    }

    #handlers;
    on(eventName, handler, context = this) {
        if (!this.#handlers[eventName]) this.#handlers[eventName] = [];
        this.#handlers[eventName].push({ handler, context });
    }

    off(eventName, handler) {
        if (this.#handlers[eventName]) {
            this.#handlers[eventName] = this.#handlers[eventName].filter(h => h.handler !== handler);
        }
    }

    trigger(event) {
        const type = event.type;

        // 1️⃣ Call user-registered handlers first
        if (this.#handlers[type]) {
            for (const { handler, context } of this.#handlers[type]) {
                try {
                    const result = handler.call(context, event, this);
                    if (result === true) return true; // stop propagation
                } catch (e) {
                    console.error(`Error in handler for ${type}:`, e);
                }
            }
        }

        // 2️⃣ Call semi-automatic on<EventName> method if defined
        const autoHandlerName = 'on' + type[0].toUpperCase() + type.slice(1);
        const autoHandler = this[autoHandlerName];
        if (typeof autoHandler === 'function') {
            try {
                const result = autoHandler.call(this, event, this);
                if (result === true) return true; // stop propagation
            } catch (e) {
                console.error(`Error in ${autoHandlerName}:`, e);
            }
        }

        // 3️⃣ Propagate to parent if not stopped
        if (this.parent) {
            return this.parent.trigger(event);
        }

        return false;
    }

    once(eventName, handler, context = this) {
        const wrapper = (event, ctrl) => {
            handler.call(context, event, ctrl);
            this.off(eventName, wrapper);
        };
        this.on(eventName, wrapper, context);
    }

    clearEvents(eventName) {
        if (eventName) delete this.#handlers[eventName];
        else this.#handlers = {};
    }

    #visuals = {
        'left': '0px',
        'top': '0px',
        'width': '100px',
        'height': '100px',
        'color': 'black',
        'background-color': 'white',
        'border-color': 'black',
        'border-width': '1px',
        'border-style': 'solid',
        'font-size': '14px',
        'font-family': 'Arial, sans-serif',
        'text-align': 'center',
        'padding': '4px',
        'margin': '2px'
    };
    #prevVisuals = {};
    getVisual(prop) {
        return this.#visuals[prop];
    }
    addVisual(prop, value) {
        this.#prevVisuals[prop] = this.#visuals[prop];
        this.#visuals[prop] = value;
        this.view?.applyVisual(prop, this.#visuals[prop]);
    }
    removeVisual(prop) {
        this.#visuals[prop] = this.#prevVisuals[prop];
        this.view?.applyVisual(prop, this.#visuals[prop]);
    }
    setVisuals(visuals) {
        for (let [k, v] of Object.entries(visuals)) {
            this.#prevVisuals[prop] = this.#visuals[k];
            this.#visuals[k] = v;
        }
        this.view?.applyVisuals(visuals);
    }

    #visualClasses = new Set();
    addVisualClass(className) {
        if (!this.#visualClasses.has(className)) {
            this.#visualClasses.add(className);
            this.view?.addVisualClass(className);
        }
    }
    removeVisualClass(className) {
        this.#visualClasses.delete(className);
        this.view?.removeVisualClass(className);
    }


    constructor(id) {
        if (!id) throw new Error("Control must have an id");
        this.#id = id;
        this.#parent = null;
        this.#view = null;
        this.#handlers = {};
    }

    async destroy() {
        if (this.view) {
            await this.#view.onDetach();
        }
    }
}