(function() {

    var glui = {
        controls: [],
        scale: { x:1, y:1 },
        mode: null,
        canvas: null,
        renderingContext2d: null,
        renderingContext3d: null,
        left: 0,
        top: 0,
        width: 0,
        height: 0,

        animations: [],

        getType: function getType(tagName) {
            var type = null;
            var name = tagName.toLowerCase().split('gl-')[1];
            if (name) {
                var typeName = name.charAt(0).toUpperCase() + name.substr(1);
                type = glui[typeName] ? glui[typeName] : null;
            }
            return type;
        },
        fromNode: function fromNode(node, parent) {
            var control = null;
            var type = this.getType(node.tagName);
            if (type) {
                var control = Reflect.construct(type, []);
                control.parent = parent || this;
                control.fromNode(node);
            }            
            return control;
        },
        create: function create(id, tmpl, parent, context) {
            context = context || this.context;
            var ctrl = glui.Control.create(id, tmpl, parent, context);
            ctrl.addHandlers();
            //if (parent == null) {
                var ix = this.controls.findIndex(x => x.zIndex < ctrl.zIndex);
                if (ix != -1) {
                    this.controls.splice(ix, 0, ctrl);
                } else {
                    this.controls.push(ctrl);
                }
            //}
            return ctrl;
        },
        remove: function remove(control) {
            for (var i=0; i<this.controls.length; i++) {
                if (this.controls[i] == control) {
                    this.controls.splice(i, 1);
                }
            }
            return control;
        },
        initialize: function initialize(app) {
            this.context = app;
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'gl-canvas';
            document.body.appendChild(this.canvas);
        },
        shutdown: function shutdown() {
            // remove controls
            for (var i=0; i<glui.controls.length; i++) {
                delete glui.controls[i];
            }
            glui.controls.splice(0, glui.controls.length);
            glui.Control.focused = null;
            glui.Control.atCursor = null;
            glui.Control.dragging = null;
            // remove animations
            // for (var i=0; i<glui.animations.length; i++) {
            // }
            glui.animations.splice(0, glui.animations.length);
        },
        buildUI: async function buildUI(parent) {
            var nodes = document.body.querySelectorAll('*');
            for (var i=0; i<nodes.length; i++) {
                if (nodes[i].tagName.toLowerCase().startsWith('gl-')) {
                    var control = this.fromNode(nodes[i], parent || this.parent);
                    if (control) {
                        this.controls.push(control);
                    }
                    document.body.removeChild(nodes[i]);
                }
            }
            document.body.style.display = 'block';
            this.animate();
        },
        setRenderingMode: function setRenderingMode(mode) {
            var ctx = null;
            glui.mode = mode || glui.Render2d;
            if (mode == glui.Render2d) {
                ctx = glui.renderingContext2d = glui.renderingContext2d || glui.canvas.getContext('2d');
            } else if (mode == glui.Render3d) {
                ctx = glui.renderingContext3d = glui.renderingContext3d || glui.canvas.getContext('webgl');
            }
            for (var i=0; i<glui.controls.length; i++) {
                if (!glui.controls[i].parent) {
                    glui.controls[i].setRenderer(mode, mode == glui.Render2d ? glui.renderingContext2d : glui.renderingContext3d);
                }
            }
            glui.resize(false);
            return ctx;
        },
        render: function render() {
            // var canvas = typeof ref === 'string' ? document.getElementById(ref) : ref;
            // if (canvas != null) glui.canvas = canvas;
            // else canvas = glui.canvas;
            // if (glui.mode == null) {
            //     glui.mode = mode || '2d';
            //     var ctx = canvas.getContext(glui.mode);
            //     glui.mode == '2d' ? glui.context = ctx : glui.gl = ctx;
            // }
            // glui.resize();
            // var is2d = glui.mode == '2d';
            for (var i=0; i<glui.controls.length; i++) {
                if (!glui.controls[i].parent) {
                    glui.controls[i].render();
                }
            }
        },
        resize: function resize(repaint) {
            glui.width = Math.floor(glui.scale.x * glui.canvas.clientWidth);
            glui.height = Math.floor(glui.scale.y * glui.canvas.clientHeight);
            glui.canvas.width = glui.width;
            glui.canvas.height = glui.height;
            for (var i=0; i<glui.controls.length; i++) {
                var ctrl = glui.controls[i];
                if (ctrl.parent == null) {
                    var left = ctrl.left, top = ctrl.top;
                    ctrl.renderer.initialize();
                    ctrl.move(left, top);
                    if (repaint) ctrl.render();
                }
            }
        },
        getControlAt: function getControlAt(x, y) {
            var cx = x*glui.scale.x, cy = y*glui.scale.y;
            var res = null;
            for (var i=0; i<glui.controls.length; i++) {
                var ctrl = glui.controls[i];
                if (ctrl.left < cx  && cx < ctrl.left + ctrl.width && ctrl.top < cy  && cy < ctrl.top + ctrl.height) {
                    res = ctrl;
                    //ctrl.getControlAt(x, y);
                    break;
                }
            }
            return res;
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
            requestAnimationFrame(glui.animate);
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

    // window.addEventListener('resize', e => {
    //     // glui.scale.x = glui.canvas.width / glui.canvas.clientWidth;
    //     // glui.scale.y = glui.canvas.height / glui.canvas.clientHeight;
    //     glui.resize(true);
    // });

    public(glui, 'glui');
})();
