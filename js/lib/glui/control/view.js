export default class View {
    #control;
    get control() {
        return this.#control;
    }

    constructor(control) {
        if (!control) {
            throw new Error("View must be associated with a Control");
        }
        this.#control = control;
    }

        // Called when the view is attached to a Control
    onAttach(control) {
        // Default: do nothing, override in subclasses
    }

    // Called when the view is detached from a Control
    onDetach() {
        // Default: do nothing, override in subclasses
    }

    // --- Rendering and event binding ---

    // Render the view
    render(parentElement) {
        throw new Error("render() must be implemented by subclass");
    }

    // Bind events (input, clicks, touch, etc.)
    bindEvents() {
        throw new Error("bindEvents() must be implemented by subclass");
    }

    // Update the view to reflect Control state changes
    update() {
        throw new Error("update() must be implemented by subclass");
    }
}
