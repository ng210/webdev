include('demo-base.js');

var DemoMgr = {
    demos: null,
    demoList: null,
    fps: null,
    demo: null,
    isRunning: false,
    frame: 0,
    time: 0,
    controls: {},
    animationId: 0,
    totalTime: 0,
    fpsCounter: 0,
    fpsTime: 0,

    initialize: async function(url) {
        console.log('load ' + url);
        var res = await load(appUrl.toString() + '/' + url);
        if (res.error) {
            alert(res.error);
            return;
        }
        this.demos = res.data;
        for (var i in this.demos) {
            if (this.demos.hasOwnProperty(i)) {
                var path = appUrl.toString() + '/' + this.demos[i].path.replace(/\/\w+\.js$/, '/mini.png');
                console.log('load ' + path);
                res = await window.load(path);
                this.demos[i].image = !res.error ? res.node : new Image(64, 64);                
            }
        }
        
        // create demo list
        console.log('create demo list');
        var demoList = this.demoList = await glui.create('list', {
            'type': 'Table',
            'style': {
                'font': 'Arial 18',
                'left': '1em',
                'top': '1em',
                'width':'194px',
                'align':'right middle',
                'border':'#406080 1px inset',
                'background-color': '#c0e0ff',
                'color':'#ffe080',
                'title': {
                    'font': 'Arial 18', 'height':'1.8em',
                    'align':'center middle',
                    'border':'#84b0e0 2px inset',
                    'background-color': '#a0c0ff'
                },
                'visible': false
            },
            'title': 'Demo List',
            'cols': 3,
            'cell-template': { 'type': 'Label', 'data-field': 'label', 'style': {
                'width':'64px', 'height':'64px', 'font': 'Arial 14', 'align':'center middle', 'background-color': '#406080', 'border':'#406080 1px outset'
            } }
        }, null, this);
        demoList.onclick = async function demoList_onclick (e, ctrl) {
            if (ctrl.dataSource) {
                await DemoMgr.selectDemo(DemoMgr.demos[ctrl.dataField].path);
            }
        };
        demoList.dataBind(this.demos.map(x => x.label));
        await demoList.build();
        for (var i=0; i<demoList.rowCount; i++) {
            var row = demoList.rows[demoList.rowKeys[i]];
            for (var j=0; j<demoList.columnCount; j++) {
                var cell = row.cells[j];
                if (cell.dataSource) {
                    cell.renderer.backgroundImage = DemoMgr.demos[cell.dataField].image;
                }                
            }
        }
        demoList.collapsed = false;
        demoList.setVisible(true);
        demoList.render();

        this.fps = await glui.create('fps', {
            'type': 'Label',
            'data-type': 'float',
            'decimal-digits': 2,
            'style': {
                'background-color': '#e0f0ff',
                'color': '#102040',
                'width':'6em', 'height': '2em',
                'align': 'middle center',
                'border': 'none'
            }
        }, null);
        this.fps.setValue(0);

        this.resize();

        this.run();
    },
    buildUI: async function buildUI(demo) {
        this.controls.title = await glui.create('title', {
            'type': 'Label',
            'style': {
                'font': 'Arial 24',
                'width':'12em', 'height':'1.5em',
                'align':'center middle',
                'border':'#406080 2px outset',
                'background-color': '#406080',
                'visible': false
            },
            'value': demo.name
        }, null, demo);

        this.controls.settings = await glui.create('settings', {
            'type': 'Table',
            'style': {
                'font': 'Arial 12',
                'width':'20em',
                'align':'right middle',
                'border':'#406080 1px inset',
                'background-color': '#c0e0ff',
                'color':'#101820',
                'cell': {
                    'height': '1.5em'
                },
                'title': {
                    'font': 'Arial 18', 'height':'1.8em',
                    'align':'center middle',
                    'border':'#406080 1px inset',
                    'background-color': '#a0c0ff'
                }
            },
            'title': 'Settings',
            'row-template': {
                'label': { 'type': 'Label', 'style': {
                    'width':'60%', 'background-color': '#406080', 'border':'#406080 1px outset'
                } },
                'value': { 'type': 'Textbox', 'look': 'potmeter', 'data-type': 'float', 'decimal-digits': 3, 'style': {
                    'width':'40%', 'background-color': '#d0e0f0', 'border':'#80a890 1px inset'
                } }
            }
        }, null, demo);
        this.controls.settings.dataBind(demo.settings);
        await this.controls.settings.build();
        for (var ri=0; ri<this.controls.settings.rowCount; ri++) {
            var key = this.controls.settings.rowKeys[ri];
            demo.settings[key].control = this.controls.settings.rows[key].cells[1];
            demo.settings[key].link = this.controls.settings.rows[key].cells[1].dataLink;
            if (demo.settings[key].normalized) {
                demo.settings[key].control.normalize();
            }
        }
        this.controls.start = await glui.create('start', {
            'type': 'Button',
            'style': {
                'width':'8em',
                'height':'1.5em',
                'font':'Arial 15',
                'align':'center middle',
                'border':'#406080 2px',
                'background':'#406080',
                'visible': true
            },
            'value': this.isRunning ? 'Stop' : 'Start'
        }, null, demo);
    },
    load: async function load(url) {
        var res = await window.load(appUrl.toString() + '/' + url);
        if (res.error) {
            return res.error;
        }
        var demo = Object.values(Resource.cache[res.url].symbols).find( x => x instanceof Demo);
        demo.context = this;
        await DemoMgr.buildUI(demo);
        // await glui.setRenderingMode(glui.Render2d);
        this.demo = demo;

        if (typeof demo.initialize === 'function') {
            await demo.initialize();
        }
        this.totalTime = 0;
        this.frame = 0;
        this.fpsCounter = 0;
        this.controls.settings.getBoundingBox();
        this.resize();

        return demo;
    },
    run: async function run() {
        cancelAnimationFrame(this.animationId);
        await lock('RUN', () => {
            var now = new Date().getTime();
            var dt = now - this.time;
            if (this.isRunning) {
                this.totalTime += dt;
                var secs = dt/1000;
                this.demo.update(this.frame, secs);
                this.demo.render(this.frame, secs);
                this.frame++;
                this.time = now;
            }
            this.fpsTime += dt;
            this.fpsCounter++;
            if (this.fpsCounter > 10) {
                this.fps.setValue(this.fpsCounter*1000 / this.fpsTime);
                this.fpsCounter = 0;
                this.fpsTime = 0;
                this.fps.render();
            }
            this.animationId = requestAnimationFrame( () => DemoMgr.run());
        });
        this.render();
    },
    render: function render() {
        if (this.demo) {
            this.demo.render(this.frame);
            this.controls.title.render();
            this.controls.settings.render();
            this.controls.start.render();
        }
        this.demoList.render();
        this.fps.render();
        glui.render();
        //glui.screen.renderer.render();
    },
    resize: function resize(e) {
        glui.clearRect();
        if (this.demo) {
            this.demo.resize();
            var top = 20, left = glui.width - Math.max(this.controls.title.width, this.controls.settings.width) - 20;
            var width = Math.max(this.controls.title.width, this.controls.settings.width, this.controls.start.width);
            this.controls.title.move(left + (width - this.controls.title.width)/2, top);
            top += this.controls.title.height + 4;
            this.controls.settings.move(left + (width - this.controls.settings.width)/2, top);
            top += this.controls.settings.height + 8;
            this.controls.start.move(left + (width - this.controls.start.width)/2, top);
        }
        this.fps.move(4, glui.screen.height - 4 - this.fps.height);
    },
    toggleDemoList: function toggleDemoList() {
        if (!this.demoList.collapsed) {
            this.demoList.height_ = this.demoList.height;
            this.demoList.height = this.demoList.titlebar.height;
            this.demoList.titlebar.renderer.border.style = 'outset';
            this.demoList.collapsed = true;
        } else {
            this.demoList.height = this.demoList.height_;
            this.demoList.titlebar.renderer.border.style = 'inset';
            this.demoList.collapsed = false;
        }
        this.render(0, 0);
    },

    selectDemo: async function selectDemo(path) {
        await lock('RUN', () => cancelAnimationFrame(this.animationId));
        if (this.demo) {
            // destroy demo
            for (var i in this.controls) {
                glui.remove(this.controls[i]);
            }
            if (typeof this.demo.destroy === 'function') {
                this.demo.destroy();
            }
        }
        // load and run demo
        var demo = await DemoMgr.load(path);
        if (demo instanceof Error) {
            alert(demo.message);
        } else {
            this.time = new Date().getTime();
            this.run();
        }
    },
    onclick: function onclick(e, ctrl) {
        if (ctrl) {
            switch (ctrl.id) {
                case 'start':
                    if (!this.isRunning) {
                        this.time = new Date().getTime();
                    }
                    this.isRunning = !this.isRunning;
                    ctrl.value = this.isRunning ? 'Stop' : 'Start';
                    ctrl.render();
                    if (this.demo && this.demo.onstartstop) {
                        this.demo.onstartstop();
                    }
                    break;
                case 'list#title':
                    this.toggleDemoList();
                    break;
                case 'screen':
                    if (this.demo && this.demo.onclick) {
                        var x = e.clientX/glui.canvas.clientWidth;
                        var y = e.clientY/glui.canvas.clientHeight;
                        this.demo.onclick(x, y, e);
                    }
                    break;
            }
        }
    },
    ondragging: function ondragging(e, ctrl) {
        if (this.demo && this.demo.ondragging) {
            if (!ctrl || ctrl.id == 'screen') {
                var x = e.clientX/glui.canvas.clientWidth;
                var y = e.clientY/glui.canvas.clientHeight;
                this.demo.ondragging(x, y, e);
            } else {
                this.demo.ondragging(e, ctrl);
            }
        }
    },
    onmousedown: function onmousedown(e, ctrl) {
        if (!ctrl || ctrl.id == 'screen') {
            if (this.demo && typeof this.demo.onmousedown == 'function') {
                var x = e.clientX/glui.canvas.clientWidth;
                var y = e.clientY/glui.canvas.clientHeight;
                this.demo.onmousedown(x, y, e);
            }
        }
    },
    onmouseup: function onmouseup(e, ctrl) {
        if (!ctrl || ctrl.id == 'screen') {
            if (this.demo && this.demo.onmouseup) {
                var x = e.clientX/glui.canvas.clientWidth;
                var y = e.clientY/glui.canvas.clientHeight;
                this.demo.onmouseup(x, y, e);
            }
        }
    },
    onchange: function onchange(e, ctrl) {
        this.demo.render(this.frame, 0);
        glui.render();
    },
    onmousemove: function onmousemove(e, ctrl) {
        if (!ctrl || ctrl.id == 'screen') {
            if (this.demo && typeof this.demo.onmousemove === 'function') {
                var x = e.clientX;
                var y = e.clientY;
                this.demo.onmousemove(x, y, e);
            }
        }
    },
    onkeydown: function onkeydown(e, ctrl) {
        if (!ctrl || ctrl.id == 'screen') {
            if (this.demo && typeof this.demo.onkeydown === 'function') {
                this.demo.onkeydown(e.keyCode, e);
            }
        }
    },
    onkeyup: function onkeyup(e, ctrl) {
        if (!ctrl || ctrl.id == 'screen') {
            if (this.demo && typeof this.demo.onkeyup === 'function') {
                this.demo.onkeyup(e.keyCode, e);
            }
        }
    }
};

async function onpageload(e) {
    if (e.length) {
        alert(e.join('\n'));
    }
    glui.scale.x = 0.8;
    glui.scale.y = 0.8;
    glui.initialize(DemoMgr);
    console.log('glui initialize');
    var cvs = glui.canvas;
    cvs.style.backgroundColor = '203040';
    window.addEventListener('resize', () => DemoMgr.resize());
    DemoMgr.initialize('demo-list.json');
}