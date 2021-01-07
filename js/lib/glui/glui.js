(function() {

    const MAX_DBLCLICK_DELAY = 400; // ms

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
        frame: 0,
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        controlCount: 0,
        isRunning: false,
        lastMouseUpTime: 0,

        markedForRendering: {},
        modalDialogs: [],

        animations: [],
        animateId: 0,

        keys: {},

        getType: function getType(tagName) {
            var type = null;
            var name = tagName.toLowerCase().split('gl-')[1];
            if (name) {
                var typeName = name.charAt(0).toUpperCase() + name.substr(1);
                type = glui[typeName] ? glui[typeName] : null;
            }
            return type;
        },
        fromNode: async function fromNode(node, context) {
            var control = null;
            var type = this.getType(node.tagName);
            if (type) {
                node.id = node.id || 'ctrl' + glui.controlCount;
                control = await glui.Control.fromNode(node, type, context);
                if (type == glui.Table) {
                    await control.build();
                }
            }            
            return control;
        },
        create: async function create(id, tmpl, parent, context) {
            var ctrl = await glui.Control.create(id, tmpl, parent || this.screen, context);
            ctrl.addHandlers();
            this.controlCount++;
            return ctrl;
        },
        remove: function remove(control) {
            this.screen.remove(control);
        },
        initialize: async function initialize(app, isFullscreen) {
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
            delete this.screen.onmouseover; // = function onmouseover() { return true; };
            delete this.screen.onmouseout;  // = function onmouseout() { return true; };
            this.screen.addHandlers();
            await this.setRenderingMode(glui.Render2d);
            document.addEventListener('keydown', glui.onevent);
            document.addEventListener('keyup', glui.onevent);
            document.addEventListener('mouseup', glui.onevent);
            document.addEventListener('mousedown', glui.onevent);
            document.addEventListener('mousemove', glui.onevent);
            document.addEventListener('dragging', glui.onevent);
        },
        shutdown: function shutdown() {
            this.reset();
            // remove event handlers
            document.removeEventListener('keydown', glui.onevent);
            document.removeEventListener('keyup', glui.onevent);
            document.removeEventListener('mouseup', glui.onevent);
            document.removeEventListener('mousedown', glui.onevent);
            document.removeEventListener('mousemove', glui.onevent);
            document.removeEventListener('dragging', glui.onevent);
            //window.removeEventListener('resize', glui.resize);
        },
        reset: function reset() {
            this.focusedControl = null;
            this.controlAtCursor = null;
            this.dragging = null;

            cancelAnimationFrame(this.animateId);
            this.animations.splice(0, this.animations.length);

            for (var i=0; i<this.screen.items.length; i++) {
                this.screen.items[i].destroy();
            }
            this.screen.items.splice(0, this.screen.items.length);
        },
        buildUI: async function buildUI(context) {
            var nodes = document.body.querySelectorAll('*');
            var p = [];
            for (var i=0; i<nodes.length; i++) {
                if (nodes[i].tagName.toLowerCase().startsWith('gl-')) {
                    var control = await this.fromNode(nodes[i], context || this.context);
                    document.body.removeChild(nodes[i]);
                }
            }
            await Promise.all(p);
        },
        setRenderingMode: async function setRenderingMode(mode) {
            this.mode = mode || glui.Render2d;
            if (mode == glui.Render2d) {
                this.renderingContext = this.renderingContext2d = this.renderingContext2d || glui.canvas.getContext('2d');
            } else if (mode == glui.Render3d) {
                this.renderingContext = this.renderingContext3d = this.renderingContext3d || glui.canvas.getContext('webgl');
            }
            await this.screen.setRenderer(mode, this.renderingContext);
            glui.resize();
            return this.renderingContext;
        },
        markForRendering: function markForRendering(ctrl) {
            this.markedForRendering[ctrl.id] = ctrl;
        },
        clearRect: function clearRect(left, top, width, height) {
            left = left || 0;
            top = top || 0;
            width = width || this.canvas.width;
            height = height || this.canvas.height;
            this.renderingContext2d.clearRect(left, top, width, height);
        },
        repaint: function repaint() {
            this.markedForRendering = {};
            this.renderingContext2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.screen.renderer.render();
        },
        resize: function resize() {
            if (glui.canvas) {
                glui.width = Math.floor(glui.scale.x * glui.canvas.clientWidth);
                glui.height = Math.floor(glui.scale.y * glui.canvas.clientHeight);
                glui.screen.width = glui.canvas.width = glui.width;
                glui.screen.height = glui.canvas.height = glui.height;
                for (var i=0; i<glui.screen.items.length; i++) {
                    var ctrl = glui.screen.items[i];
                    ctrl.size(null, null);
                    // ctrl.renderer.initialize(ctrl, glui.renderingContext);
                    // ctrl.getBoundingBox();
                    //ctrl.move(left, top);
                }
                glui.repaint();
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
        render: function render() {
            for (var i=0; i<glui.animations.length; i++) {
                var anim = glui.animations[i];
                anim.counter -= 50;
                if (anim.counter < 0) {
                    anim.counter += anim.timeout;
                    anim.fn.call(anim.obj, anim.args);
                }
            }
            var marks = Object.values(glui.markedForRendering);
            glui.markedForRendering = {};
            for (var i=0; i<marks.length; i++) {
                debug_('render ' + marks[i].id, 2);
                var r = marks[i].renderer;
                if (r.lastFrame != glui.frame) {
                    r.render();
                    r.lastFrame = glui.frame;
                }
            }
            glui.frame++;
        },
        animate: function animate() {
            glui.isRunning = true;
            if (glui.animateId) cancelAnimationFrame(glui.animateId);
            glui.render();
            glui.animateId = requestAnimationFrame(glui.animate);
        },
        onevent: function onevent(e) {
            // get control by coordinates
            var event = e.type;
            var clientX = e.clientX * glui.scale.x;
            var clientY = e.clientY * glui.scale.y;
            var control = glui.screen.getControlAt(clientX, clientY, true);
            if (control == null) control = glui.focusedControl;
           //console.log(`${event} for target=${e.target}, this=${this}, control=${this.control ? this.control : e.target.control ? e.target.control : 'none'}, Control.focused=${Control.focused}`);
            if (!control || control.disabled) {
                return false;
            }
            if (glui.modalDialogs[0] && !control.isDescendant(glui.modalDialogs[0])) return false;                
            e.control = control;
            e.controlX = clientX - control.left_;
            e.controlY = clientY - control.top_;
            if (event == 'mousedown') {
                // check onfocus/onblur
                glui.setFocus(control);
                if (glui.focusedControl) {
                    glui.dragging = glui.focusedControl;
                    glui.dragStartX = glui.dragX = e.screenX;
                    glui.dragStartY = glui.dragY = e.screenY;
                    glui.dragOffsetX = e.controlX;
                    glui.dragOffsetY = e.controlY;
                }
            } else if (event == 'mousemove') {
                if (glui.dragging) {
                    var draggingEvent = {
                        type: "dragging",
                        control: control,
                        screenX: e.screenX,
                        screenY: e.screenY,
                        clientX: clientX,
                        clientY: clientY,
                        controlX: e.controlX,
                        controlY: e.controlY,
                        startX: glui.dragStartX,
                        startY: glui.dragStartY,
                        offsetX: glui.dragOffsetX,
                        offsetY: glui.dragOffsetY,
                        deltaX: (e.screenX - glui.dragX)*glui.scale.x,
                        deltaY: (e.screenY - glui.dragY)*glui.scale.y
                    };
                    if (glui.keys[16]) draggingEvent.shiftKey = true;
                    if (glui.keys[18]) draggingEvent.altKey = true;
                    if (glui.keys[17]) draggingEvent.ctrlKey = true;
                    glui.dragging.callHandler('dragging', draggingEvent);
                    glui.dragX = e.screenX;
                    glui.dragY = e.screenY;
                    return;
                }

                if (control != glui.controlAtCursor) {
                    if (glui.controlAtCursor && !e.control.isDescendant(glui.controlAtCursor)) {
                        glui.controlAtCursor.callHandler('mouseout', e);
                    }
                    e.control = glui.controlAtCursor;
                    glui.controlAtCursor = control;
                    if (control && (!e.control || !e.control.isDescendant(glui.controlAtCursor))) {
                        control.callHandler('mouseover', e);
                    }
                }
            } else if (event == 'mouseup') {
                glui.dragging = null;
                if (control && control == glui.focusedControl) {
                    var t = new Date().getTime();
                    var d = t - glui.lastMouseUpTime;
                    glui.lastMouseUpTime = t;
                    if (d < MAX_DBLCLICK_DELAY && control == glui.lastClicked) {
                        setTimeout( () => control.callHandler('dblclick', e), 0);
                    } else {
                        setTimeout( () => control.callHandler('click', e), 0);
                    }
                    glui.lastClicked = control;
                } else {
                    glui.focusedControl.callHandler('mouseup', e)
                }
            }
    
            if (event == 'keydown' || event == 'keyup') {
                glui.keys[e.keyCode] = event == 'keydown';
                if (control == glui.screen) {
                    control = glui.focusedControl;
                }
            }

            if (control) {
                e.control = control;
                control.callHandler(e.type, e);
            }
        },
        setFocus: function setFocus(control) {
            if (control != glui.focusedControl) {
                if (glui.focusedControl) {
                    var ctrl = glui.focusedControl;
                    glui.focusedControl = control;
                    ctrl.callHandler('blur', {
                        'type': 'blur',
                        'control': control
                    });
                }
                if (control) {
                    control.callHandler('focus',  {
                        'type': 'focus',
                        'control': control
                    });
                    glui.focusedControl = control;
                }
            }
        },
        lastClicked: null,
        focusedControl: null,
        atCursor: null,
        dragging: null,
        draggedControl : null,
        dragStartX: 0,
        dragStartY: 0,    
        dragX: 0,
        dragY: 0,

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

    window.addEventListener('resize', glui.resize);

    publish(glui, 'glui');
})();
