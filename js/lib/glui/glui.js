(function() {

    var glui = {
        //controls: [],
        scale: { x:1, y:1 },
        mode: null,
        canvas: null,
        screen: null,
        context: null,
        renderingContext: null,
        renderingContext2d: null,
        renderingContext3d: null,
        frontBuffer: null,
        backBuffer: null,
        left: 0,
        top: 0,
        width: 0,
        height: 0,

        animations: [],
        animateId: 0,

        getType: function getType(tagName) {
            var type = null;
            var name = tagName.toLowerCase().split('gl-')[1];
            if (name) {
                var typeName = name.charAt(0).toUpperCase() + name.substr(1);
                type = glui[typeName] ? glui[typeName] : null;
            }
            return type;
        },
        fromNode: function fromNode(node, context) {
            var control = null;
            var type = this.getType(node.tagName);
            if (type) {
                var control = Reflect.construct(type, []);
                control.context = context || this.context;
                control.fromNode(node);
                control.addHandlers();
            }            
            return control;
        },
        create: function create(id, tmpl, parent, context) {
            context = context;
            var ctrl = glui.Control.create(id, tmpl, parent, context);
            ctrl.addHandlers();
            if (parent == null) {
                this.screen.add(ctrl);
            }
            //ctrl.setRenderer(this.mode, this.mode == glui.Render2d ? this.renderingContext2d : this.renderingContext3d);
            return ctrl;
        },
        remove: function remove(control) {
            this.screen.remove(control);
            // for (var i=0; i<this.controls.length; i++) {
            //     if (this.controls[i] == control) {
            //         this.controls.splice(i, 1);
            //         control.destroy();
            //         delete control;
            //     }
            // }
        },
        initialize: function initialize(app, isFullscreen) {
            document.body.style.display = 'block';
            this.context = app;
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'gl-canvas';
            document.body.appendChild(this.canvas);
            if (isFullscreen) {
                this.canvas.style.position = 'absolute';
                this.canvas.style.top = '0px';
                this.canvas.style.left = '0px';
                this.canvas.style.zIndex = '10';
                this.canvas.style.width = '100vw';
                this.canvas.style.height = '100vh';
            }
            this.frontBuffer = new glui.Buffer(this.canvas);
            this.backBuffer = new glui.Buffer(this.canvas.width, this.canvas.height);
            this.screen = new glui.Container('screen', null, null, app);
            this.setRenderingMode(glui.Render2d);
        },
        shutdown: function shutdown() {
            // remove controls
            this.screen.destroy();
            // for (var i=0; i<glui.controls.length; i++) {
            //     delete glui.controls[i];
            // }
            // glui.controls.splice(0, glui.controls.length);
            glui.Control.focused = null;
            glui.Control.atCursor = null;
            glui.Control.dragging = null;
            // remove animations
            // for (var i=0; i<glui.animations.length; i++) {
            // }
            glui.animations.splice(0, glui.animations.length);
        },
        buildUI: async function buildUI(context) {
            var nodes = document.body.querySelectorAll('*');
            for (var i=0; i<nodes.length; i++) {
                if (nodes[i].tagName.toLowerCase().startsWith('gl-')) {
                    var control = this.fromNode(nodes[i], context || this.context);
                    if (control) {
                        this.screen.add(control);
                    }
                    document.body.removeChild(nodes[i]);
                }
            }
        },
        setRenderingMode: async function setRenderingMode(mode) {
            this.mode = mode || glui.Render2d;
            if (mode == glui.Render2d) {
                this.renderingContext = this.renderingContext2d = this.renderingContext2d || glui.canvas.getContext('2d');
            } else if (mode == glui.Render3d) {
                this.renderingContext = this.renderingContext3d = this.renderingContext3d || glui.canvas.getContext('webgl');
            }
            await this.screen.setRenderer(mode, this.renderingContext);
            glui.resize(false);
            return this.renderingContext;
        },
        render: function render() {
            //this.renderingContext2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.screen.render();
        },
        repaint: function repaint() {
            this.renderingContext2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.render();
        },
        resize: function resize(repaint) {
            this.width = Math.floor(this.scale.x * this.canvas.clientWidth);
            this.height = Math.floor(this.scale.y * this.canvas.clientHeight);
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            for (var i=0; i<this.screen.items.length; i++) {
                var ctrl = this.screen.items[i];
                var left = ctrl.left, top = ctrl.top;
                ctrl.renderer.initialize(ctrl, this.renderingContext);
                ctrl.move(left, top);
                if (repaint) ctrl.render();
            }
        },
        getControlAt: function getControlAt(x, y, recursive) {
            var cx = x*glui.scale.x, cy = y*glui.scale.y;
            return this.screen.getControlAt(cx, cy, recursive);
        },
        getControlById: function getControlById(id) {
            return this.screen.getControlById(id);
        },
        addAnimation: function addAnimation(callback, obj, timeout, args) {
            var animationId = glui.animations.length;
            glui.animations.push({id:animationId, fn:callback, obj:obj, args: args, timeout:timeout, counter:timeout});
            callback.call(obj, args);
            return animationId;
        },
        removeAnimation: function removeAnimation(animationId) {
            var ix = glui.animations.findIndex(x => x.id == animationId);
            glui.animations.splice(ix, 1);
        },
        resetAnimation: function resetAnimation(animationId) {
            var anim = glui.animations.find(x => x.id == animationId);
            anim.counter = anim.timeout;
        },
        animate: function animate() {
            for (var i=0; i<glui.animations.length; i++) {
                var anim = glui.animations[i];
                anim.counter -= 50;
                if (anim.counter < 0) {
                    anim.counter += anim.timeout;
                    anim.fn.call(anim.obj, anim.args);
                }
            }
            if (this.animateId) cancelAnimationFrame(this.animateId);
            this.animateId = requestAnimationFrame(glui.animate);
        },

        Alignment: {
            LEFT: 1,
            CENTER: 2,
            RIGHT: 4,
            //JUSTIFIED: 8,
            TOP: 16,
            MIDDLE: 32,
            BOTTOM: 64
        },
        Render2d: 1,
        Render3d: 2,
    };

    window.addEventListener('resize', e => glui.resize(true));

    public(glui, 'glui');
})();
