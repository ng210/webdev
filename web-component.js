class WebComponent extends HTMLElement {
    #templateUrl;
    #template;
    constructor(templateUrl) {
        super();
        // create shadow DOM
        this.attachShadow({ mode: 'open' });
        this.#templateUrl = templateUrl;
    }

    async #getTemplate() {
        if (this.#template == null) {
            await this.loadTemplate();
        }
        return this.#template;
    }

    // called on component added to the webpage
    async connectedCallback() {
        await this.#getTemplate();
        this.shadowRoot.appendChild(this.#template.content.cloneNode(true));
    }

    // called on component removed from the webpage
    disconnectedCallback() {
    }

    // List of attributes to observe
    static get observedAttributes() {
        return [];
    }

    // called when attribute changed
    attributeChangedCallback(name, oldValue, newValue) {
    }

    async loadTemplate() {
        try {
            // Fetch the template file
            const response = await fetch(this.#templateUrl);
            const html = await response.text();
            this.#template = document.createElement('template');
            this.#template.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading template:', error);
        }
    }
}

export { WebComponent }

// 1. Implement your web component class by extending WebComponent
// 2. Register your component by calling WebComponent.register(<your component's tag>, <your component class>)
// 3. Add an instance of your component either by inserting a <your component's tag> element in the HTML or
//    creating a new element by calling document.createElement(<your component's tag>)
