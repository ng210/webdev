import View from '../view.js'

export default class HtmlView extends View {
    #getStyleValue(prop, defaultValue) {
        let style = getComputedStyle(this.element);
        return style[prop] ?? defaultValue;
    }
    #setStyleValue(prop, value) {
        if (this.element) {
            this.element.style[prop] = value;
        }        
    }

    // get left() { return this.#getStyleValue('left'); }
    // set left(v) { return this.#setStyleValue('left', v); }
    // get top() { return this.#getStyleValue('top'); }
    // set top(v) { return this.#getStyleValue('top', v); }
    // get width() { return this.#getStyleValue('width'); }
    // set width(v) { return this.#getStyleValue('width', v); }
    // get height() { return this.#getStyleValue('height'); }
    // set height(v) { return this.#getStyleValue('height', v); }

    constructor(htmlElement = null) {
        super();
        if (htmlElement != null) {
            this.element = htmlElement;
        }
    }

    createElement(tagName, classList = []) {
        this.element = document.createElement(tagName);
        this.element.classList.add(...classList);
    }

    async onAttach(control) {
        await super.onAttach(control);
        
        if (this.element) {
            this.update();
        }

        let parentElement = this.control.parent?.view?.element;
        if (parentElement) {
            // HTML append
            parentElement.appendChild(this.element);
        }
    }

    initVisuals(visuals) {
        // if (this.element) {
        //     const computed = getComputedStyle(this.element);
        //     let x = 0, y = 0;
        //     for (let prop in visuals) {
        //         let value = visuals[prop];
        //         switch (prop) {
        //             case 'left':
        //                 x = parseFloat(computed.left) || 0;
        //                 break;
        //             case 'top':
        //                 y = parseFloat(computed.top) || 0;
        //                 break;
        //             default:
        //                 visuals[prop] = value;
        //         }                
        //     }
        //     this.control.setPosition(x, y);
        // }
        return visuals;
    }

    async onDetach() {
        await super.onDetach();
        if (this.element?.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    addEventHandler(eventName, handler) {
        this.element.addEventListener(eventName, domEvent => {
            //console.log(domEvent.type, domEvent.target.id)
            let event = {
                type: domEvent.type,
                target: this.control,
                pointerId: domEvent.pointerId,
                x: domEvent.clientX,
                y: domEvent.clientY,
                buttons: domEvent.buttons,
                keys: {
                    alt: domEvent.altKey,
                    ctrl: domEvent.ctrlKey,
                    shift: domEvent.shiftKey,
                    meta: domEvent.metaKey
                },
                key: domEvent.key,
                oldValue: this.control.value,
                newValue: domEvent.target.value
            };
            domEvent.stopPropagation();
            return handler(event);
        });
    }

    removeEventHandler(eventName, handler) {
        this.element.removeEventListener(eventName, handler);
    }

    static transformValue(prop, value) {
        switch (prop) {
            case 'left':
            case 'top':
            case 'width':
            case 'height':
                if (typeof value === 'number') {
                    value = `${value}px`;
                }
                break;
        }
        return value;
    }

    applyVisual(prop, value) {
        if (this.element) {
            this.element.style[prop] = HtmlView.transformValue(prop, value);
        }
    }

    addVisualClass(className) {
        if (this.element) {
            this.element.classList.add(className);
        }
    }
    removeVisualClass(className) {
        if (this.element) {
            this.element.classList.remove(className);
        }
    }

    setPointerCapture(event) {
        if (this.element) {
            this.element.setPointerCapture(event.pointerId);
        }
    }

    releasePointerCapture(event) {
        if (this.element) {
            this.element.releasePointerCapture(event.pointerId);
        }
    }
}