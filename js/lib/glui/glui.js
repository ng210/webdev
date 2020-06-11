(function() {

    var glui = {
        controls: [],
        scale: [1, 1],
        mode: null,
        canvas: null,
        context: null,
        gl: null,
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
        fromNode: function fromNode(node) {
            var control = null;
            var type = glui.getType(node.tagName);
            if (type) {
                var control = Reflect.construct(type, []);
                control.parent = this;
                control.fromNode(node);
            }            
            return control;
        },
        buildUI: async function buildUI(app) {
            var nodes = document.body.querySelectorAll('*');
            glui.parent = app;
            glui.canvas = document.createElement('canvas');
            glui.canvas.id = 'gl-canvas';
            document.body.appendChild(glui.canvas);
            for (var i=0; i<nodes.length; i++) {
                if (nodes[i].tagName.toLowerCase().startsWith('gl-')) {
                    var control = glui.fromNode(nodes[i]);
                    if (control) {
                        glui.controls.push(control);
                    }
                    document.body.removeChild(nodes[i]);
                }
            }
            document.body.style.display = 'block';
            glui.animate();
        },
        setRenderingMode: function setRenderingMode(mode) {
            glui.mode = mode || glui.Render2d;
            if (mode == glui.Render2d) {
                glui.context = glui.context || glui.canvas.getContext('2d');
            } else if (mode == glui.Render3d) {
                glui.gl = glui.gl || glui.canvas.getContext('webgl');
            }
            for (var i=0; i<glui.controls.length; i++) {
                glui.controls[i].setRenderer(mode, mode == glui.Render2d ? glui.context : glui.gl);
            }
            glui.resize(false);
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
                glui.controls[i].renderer.render();
            }
        },
        resize: function resize(repaint) {
            glui.width = Math.floor(glui.scale[0] * glui.canvas.clientWidth);
            glui.height = Math.floor(glui.scale[1] * glui.canvas.clientHeight);
            glui.canvas.width = glui.width;
            glui.canvas.height = glui.height;
            for (var i=0; i<glui.controls.length; i++) {
                glui.controls[i].renderer.initialize();
                if (repaint) glui.controls[i].renderer.render();
            }
        },
        getControlAt: function getControlAt(x, y) {
            var cx = x*glui.scale[0], cy = y*glui.scale[1];
            var res = null;
            for (var i=0; i<glui.controls.length; i++) {
                var ctrl = glui.controls[i];
                if (ctrl.left < cx  && cx < ctrl.left + ctrl.width && ctrl.top < cy  && cy < ctrl.top + ctrl.height) {
                    res = ctrl;
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
    
    window.onresize = e => {
        // glui.scale[0] = glui.canvas.width / glui.canvas.clientWidth;
        // glui.scale[1] = glui.canvas.height / glui.canvas.clientHeight;
        glui.resize(true);
    };

    public(glui, 'glui');
})();
