include('control.js');
include('renderer2d.js');

(function() {
    function ImageRenderer2d(control, context) {
        ImageRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.Renderer2d, ImageRenderer2d);

    ImageRenderer2d.prototype.renderControl = function renderControl() {
        this.drawImage(this.control.image, 0, 0);
    };


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
    Image.prototype.load = async function load(source) {
        source = source || this.source;
        if (this.image == null || this.image.src != source) {
            var res = await window.load(source);
            if (res.error) {
                throw new Error(res.error);
            }
            this.image = res.node;
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
    Image.prototype.setRenderer = function(mode, context) {
        if (mode == glui.Render2d) {
            if (this.renderer2d == null) {
                this.renderer2d = new ImageRenderer2d(this, context);
            }
            this.renderer = this.renderer2d;
        } else if (mode == glui.Render3d) {
            if (this.renderer3d == null) {
                this.renderer3d = new ImageRenderer3d(this, context);
            }
            this.renderer = this.renderer3d;
        }
    };

    public(Image, 'Image', glui);
    public(ImageRenderer2d, 'ImageRenderer2d', glui);
})();
