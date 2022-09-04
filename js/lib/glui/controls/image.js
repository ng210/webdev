include('control.js');
include('renderer2d.js');

(function() {
    //#region ImageRenderer2d
    function ImageRenderer2d(control, context) {
        ImageRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.Renderer2d, ImageRenderer2d);

    ImageRenderer2d.prototype.renderControl = function renderControl() {
        this.drawImage(this.control.image, 0, 0);
    };
    //#endregion

    //#region Image
    function Image(id, template, parent, context) {
        Image.base.constructor.call(this, id, template, parent, context);
        this.image = null;
        //this.renderer3d = new ImageRenderer3d()
    }
    extend(glui.Control, Image);

    Image.prototype.getTemplate = function getTemplate() {
        var template = Image.base.getTemplate.call(this);
        template.source = '';
        return template;
    };

    Image.prototype.applyTemplate = function applyTemplate(tmpl) {
        var template = Image.base.applyTemplate.call(this, tmpl);
        this.source = template.source;
        return template;
    };
    Image.prototype.getHandlers = function getHandlers() {
        var handlers = Image.base.getHandlers();
        handlers.push(
            { name: 'mousedown', topDown: true },
            { name: 'mouseup', topDown: false }
        );
        return handlers;
    };
    Image.prototype.load = function load(source) {
        source = source || this.source;
        if (this.image == null || this.image.src != source) {
            glui.waitFor(this, window.load(source), 
            function(res) {
                if (res.error) {
                    throw new Error(res.error);
                }
                this.image = res.node;
            });
        }
    };
    Image.prototype.dataBind = function dataBind(source, field) {
        Image.base.dataBind.call(this, source, field);
        if (this.dataSource && this.dataField) {
            var data = this.dataSource[this.dataField];
            if (data instanceof window.Image) {
                this.image = data;
            } else if (typeof data === 'string') {
                this.load(image);
            }
        }
        return this.dataSource;
    };
    Image.prototype.createRenderer = mode => mode == glui.Render2d ? new ImageRenderer2d() : 'ImageRenderer3d';

    glui.buildType({
        'name':'Image',
        'type':'Control',
        'attributes': {
            'source': { 'type':'string', 'default':'/res/blank.png', 'default':'' },
            'style': { 'type': 'ControlStyle', 'isRequired':false }
        }
    });
    //#endregion

    publish(Image, 'Image', glui);
    publish(ImageRenderer2d, 'ImageRenderer2d', glui);
})();
