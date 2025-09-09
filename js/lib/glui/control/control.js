// base class
export default class Control {
    #id;
    get id() { return this.#id; }
    set id(newId) { this.#id = newId; }

    #parent;
    get parent() { return this.#parent; }

    #children;
    get children() { return [...this.#children]; }
    addChild(ctrl) {
        if (this.#children.includes(ctrl)) return;
        if (ctrl.#parent) {
            ctrl.#parent.removeChild(ctrl);
        }
        ctrl.#parent = this;
        this.#children.push(ctrl);
    }

    removeChild(ctrl) {
        const i = this.#children.indexOf(ctrl);
        if (i !== -1) {
            this.#children.splice(i, 1);
            if (ctrl.#parent === this) {
                ctrl.#parent = null;
            }
        }
    }

    #view;
    get view() { return this.#view; }
    set view(v) {
        if (this.#view?.onDetach) this.#view.onDetach();
        this.#view = v;
        if (this.#view?.onAttach) this.#view.onAttach(this);
    }


    #handlers;
    on(eventName, handler, context = this) {
        if (!this.#handlers[eventName]) {
            this.#handlers[eventName] = [];
        }
        this.#handlers[eventName].push({handler, context});
    }
    off(eventName, handler) {
        if (this.#handlers[eventName]) {
            this.#handlers[eventName] = this.#handlers[eventName]
            .filter(h => h.handler !== handler);
        }
    }
    trigger(eventName, ...args) {
        if (this.#handlers[eventName]) {
            for (const { handler, context } of this.#handlers[eventName]) {
                try {
                    handler.apply(context, args);
                } catch (e) {
                    console.error(`Error in handler for ${eventName}:`, e);
                }
            }
        }
    }
    once(eventName, handler, context = this) {
        const wrapper = (...args) => {
            handler.apply(this, args);
            this.off(eventName, wrapper);
        };
        this.on(eventName, wrapper, context);
    }
    clearEvents(eventName) {
        if (eventName) {
            delete this.#handlers[eventName];
        } else {
            this.#handlers = {};
        }
    }


    constructor({ id = null } = {}) {
        this.#id = id;
        this.#parent = null;
        this.#children = [];
        this.#view = null;
        this.#handlers = {};
    }
}



// export default class Control {
//     #id = '';
//     get id() { return this.#id; }
//     set id(v) { this.#id = v; }
//     #label = '';
//     get label() { return this.#label; }
//     set label(v) { this.#label = v; }
//     get value() {
//         return this.uiElement ? this.uiElement.value : null;
//     }
//     set value(v) {
//         if (this.uiElement != null) {
//             this.uiElement.value = v;
//         }
//     }
//     #uiElement = null;
//     get uiElement() { return this.#uiElement; }
//     set uiElement(elem) {
//         this.#uiElement = elem;
//         // add handlers
//         for (let event in this.#handlers) {
//             for (let handler of this.#handlers[event]) {
//                 this.#uiElement.addHandler(event, handler);
//             }
//         }
//         // update/render?
//     }
//     #dataSource = null;
//     get dataSource() { return this.#dataSource; }
//     #title = '';
//     get title() { return this.#title; }
//     set title(v) { this.#title = v; }
//     #parent = null;
//     get parent() { return this.#parent; }
//     set parent(p) { this.#parent = p; }
//     #children = [];
//     get children() { return this.#children; }

//     get validEvents() { throw new Error('Not implemented!'); }

//     #handlers = {};
//     get handlers() { return this.#handlers; }

//     constructor(id) {
//         this.id = id;
//         this.label = id;
//     }

//     async initialize(data) { throw new Error('Not implemented!'); }
    
//     appendChild(child) { 
//         if (this.#uiElement != null && child.uiElement != null &&
//             !this.#children.includes(child) && this.#uiElement.appendChild(child.uiElement)) {
//                 if (child.parent != null) {
//                     child.parent.removeChild(child);
//                 }
//                 child.parent = this;
//                 this.#children.push(child);
//                 return true;
//         }
//         else return false;
//     }

//     removeChild(child) {
//         if (this.#children.includes(child)) {
//             this.#children.splice(this.#children.indexOf(child), 1);
//             this.#uiElement.elem.removeChild(child.uiElement.elem);
//             child.parent = null;
//         }
//     }

//     dataBind(dataSource) {
//         this.#dataSource = dataSource;
//         this.value = dataSource.value;
//         this.uiElement.onDataSourceChanged(dataSource);
//     }

//     addHandler(event, context = this, handler = null) {
//         if (this.validEvents.includes(event)) {
//             if (handler == null) {
//                 while (context != null) {
//                     handler = context[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`];
//                     if (typeof handler === 'function') break;
//                     context = context.parent;
//                 }
//             }

//             if (typeof handler !== 'function') {
//                 throw new Error(`Invalid handler for event ${event}`);
//             }

//             if (this.#handlers[event] == null) this.#handlers[event] = [];
//             let h = e => handler.apply(context, [e]);
//             this.#handlers[event].push(h);
//             if (this.#uiElement != null) {
//                 this.#uiElement.addHandler(event, h);
//             }
//         } else throw new Error(`Invalid event '${event}' for controller!`);
//     }

//     static getControl(el) {
//         let ctrl = null;
//         while (ctrl == null && el != null) {
//             if (el.uiElement != null) {
//                 ctrl = el.uiElement.control;
//             } else {
//                 el = el.parent || el.parentNode;
//             }
//         }
//         return ctrl;
//     }
// }