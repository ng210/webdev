// interface
export default class IControl {
    async initialize(data) { throw new Error('Not implemented!'); }
    get id() { throw new Error('Not implemented!'); }
    set id(v) { throw new Error('Not implemented!'); }
    get dataSource() { throw new Error('Not implemented!'); }
    set dataSource(ds) { throw new Error('Not implemented!'); }
    get value() { throw new Error('Not implemented!'); }
    set value(v) { throw new Error('Not implemented!'); }
    constructor() {}
    update(dt, frame) { throw new Error('Not implemented!'); }
    render(dt, frame) { throw new Error('Not implemented!'); }
    addHandler(event, handler) { throw new Error('Not implemented!'); }
}