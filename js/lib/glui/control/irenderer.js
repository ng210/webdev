// interface
class IRenderer {
    get name() { throw new Error('Not implemented!'); }

    createElem(data) { throw new Error('Not implemented!'); }

    update(dt, frame) { throw new Error('Not implemented!'); }
    render(dt, frame) { throw new Error('Not implemented!'); }


}