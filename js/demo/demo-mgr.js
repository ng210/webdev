include('glui/glui-lib.js');

var DemoMgr = {
    demos: null,
    demoList: null,
    demo: null,
    isRunning: false,
    frame: 0,
    time: 0,
    controls: {},
    animationId: 0,
    totalTime: 0,
    fpsCounter: 0,

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
        var demoList = this.demoList = glui.create('list', {
            'type': 'Grid',
            'style': {
                'font': 'Arial 12',
                'left': '1em',
                'top': '1em',
                'width':'24em',
                'align':'right middle',
                'border':'#406080 1px inset',
                'background': '#c0e0ff',
                'color':'#101820',
                'title': {
                    'font': 'Arial 18', 'height':'1.8em',
                    'align':'center middle',
                    'border':'#84b0e0 2px inset',
                    'background': '#a0c0ff'
                },
                'visible': false
            },
            'title': 'Demo List',
            'row-template': {
                'label': { 'type': 'Label', 'column': '$Key', 'style': {
                    'height':'64px', 'align':'center middle', 'background': '#406080', 'border':'#406080 1px outset'
                } },
                'image': { 'type': 'Image', 'column': '$Key', 'style': {
                    'width':'64px', 'height':'64px', 'background': '#406080', 'border':'#406080 1px outset'
                } }
            }
        }, null, this);
        demoList.onclick = function demoList_onclick (e, ctrl) {
            DemoMgr.selectDemo(ctrl.row.dataSource.obj.path);
        };
        demoList.dataBind(this.demos);
        demoList.collapsed = false;
        demoList.setVisible(true);
        glui.buildUI();
        await glui.setRenderingMode(glui.Render2d);
        glui.render();
        glui.animate();

        glui.canvas.addEventListener('mousemove', e => DemoMgr.onmousemove(e));
    },
    buildUI: function buildUI(demo) {
        this.controls.title = glui.create('title', {
            'type': 'Label',
            'style': {
                'font': 'Arial 24',
                'width':'12em', 'height':'1.5em',
                'align':'center middle',
                'border':'#406080 2px outset',
                'background': '#406080'
            },
            'value': demo.name
        }, null, demo);
        this.controls.settings = glui.create('settings', {
            'type': 'Grid',
            'style': {
                'font': 'Arial 12',
                'width':'20em',
                'align':'right middle',
                'border':'#406080 1px inset',
                'background': '#c0e0ff',
                'color':'#101820',
                'cell': {
                    'height': '1.5em'
                },
                'title': {
                    'font': 'Arial 18', 'height':'1.8em',
                    'align':'center middle',
                    'border':'#406080 1px inset',
                    'background': '#a0c0ff'
                }
            },
            'title': 'Settings',
            'row-template': {
                'label': { 'type': 'Label', 'column': '$Key', 'style': {
                    'width':'60%', 'background': '#406080', 'border':'#406080 1px outset'
                } },
                'value': { 'type': 'Textbox', 'look': 'potmeter', 'data-type': 'float', 'decimal-digits': 3, 'data-field': 'value', 'column': '$Key', 'style': {
                    'width':'40%', 'background': '#d0e0f0', 'border':'#80a890 1px inset'
                } }
            }
        }, null, demo);
        this.controls.settings.dataBind(demo.settings);
        for (var ri=1; ri<this.controls.settings.rowKeys.length; ri++) {
            var key = this.controls.settings.rowKeys[ri];
            demo.settings[key].control = this.controls.settings.rows[key].cells.value;
            if (demo.settings[key].normalized) {
                demo.settings[key].control.normalize();
            }
        }
        this.controls.start = glui.create('start', {
            'type': 'Button',
            'style': {
                'width':'8em',
                'height':'1.5em',
                'font':'Arial 15',
                'align':'center middle',
                'border':'#406080 2px',
                'background':'#406080'
            },
            'value': this.isRunning ? 'Stop' : 'Start'
        }, null, demo);
    },
    load: async function load(url) {
        var res = await window.load(appUrl.toString() + '/' + url);
        if (res.error) {
            return res.error;
        }
        var demo = Object.values(Resource.cache[res.url].symbols)[0];
        demo.context = this;
        DemoMgr.buildUI(demo);
        await glui.setRenderingMode(glui.Render2d);
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
        if (this.isRunning) {
            await lock('RUN', () => {
                var dt = new Date().getTime() - this.time;
                this.totalTime += dt;
                this.render(this.frame, dt/1000);
                this.time = new Date().getTime();
                this.frame++;
                this.animationId = requestAnimationFrame(() => this.run());
            });
            if (this.fpsCounter == 20) {
                this.fpsCounter = 0;
                this.fps = 1000*this.frame / this.totalTime;
                //console.log(this.fps);
            }
            this.fpsCounter++;
        }
    },
    render: function render(frame, dt) {
        if (this.demo) {
            this.demo.update(frame, dt);
            this.demo.render(frame);
        } else {
            glui.renderingContext2d.clearRect(0, 0, glui.width, glui.height);   //fillRect(0, 0, glui.width, glui.height);
        }
        glui.render();
    },
    stop: async function stop() {
        return lock('RUN', () => {
            this.isRunning = false
            cancelAnimationFrame(this.animationId);
        });
    },

    resize: function resize(e) {
        if (this.demo) {
            this.demo.resize();
            this.demo.render(this.frame, 0);
            var top = 20, left = glui.width - Math.max(this.controls.title.width, this.controls.settings.width) - 20;
            var width = Math.max(this.controls.title.width, this.controls.settings.width, this.controls.start.width);
            this.controls.title.move(left + (width - this.controls.title.width)/2, top);
            top += this.controls.title.height + 4;
            this.controls.settings.move(left + (width - this.controls.settings.width)/2, top);
            top += this.controls.settings.height + 8;
            this.controls.start.move(left + (width - this.controls.start.width)/2, top);
        }
        //this.demoList.height = this.demoList.collapsed ? this.demoList.titlebar.height : 0;
        glui.render();
    },
    toggleDemoList: function toggleDemoList() {
        if (!this.demoList.collapsed) {
            this.demoList.height = this.demoList.titlebar.height;
            this.demoList.titlebar.renderer.border.style = 'outset';
            this.demoList.collapsed = true;
        } else {
            this.demoList.height = 0;
            this.demoList.titlebar.renderer.border.style = 'inset';
            this.demoList.collapsed = false;
        }
        this.render(0, 0);
    },

    selectDemo: async function(path) {
        if (this.demo) {
            // destroy demo
            await this.stop();
            for (var i in this.controls) {
                glui.remove(this.controls[i]);
            }
        }
        // load and run demo
        var demo = await DemoMgr.load(path);
        if (demo instanceof Error) {
            alert(demo.message);
        } else {
            DemoMgr.time = new Date().getTime();
            //this.isRunning = true;
            await DemoMgr.run(demo);
            this.start();
        }
    },
    start: function start() {
        this.isRunning = !this.isRunning;
        var ctrl = this.controls.start;
        ctrl.value = this.isRunning ? 'Stop' : 'Start';
        ctrl.render();
        this.time = new Date().getTime();
        this.run();

    },
    onclick: function(e, ctrl) {
        switch (ctrl.id) {
            case 'start':
                this.start();
                break;
            case 'list':
                this.toggleDemoList();
                break;
        }
    },
    onchange: function onchange(e, ctrl) {
        this.demo.render(this.frame, 0);
        glui.render();
    },
    onmousemove: function onmousemove(e) {
        if (this.demo && typeof this.demo.onmousemove === 'function') {
            this.demo.onmousemove.call(this.demo, e);
        }
    },
};

async function onpageload(e) {
    if (e.length) {
        alert(e.join('\n'));
    }
    glui.scale.x = 0.6;
    glui.scale.y = 0.6;
    glui.initialize();
    console.log('glui initialize');
    var cvs = glui.canvas;
    cvs.style.backgroundColor = '203040';
    window.addEventListener('resize', () => DemoMgr.resize());
    DemoMgr.initialize('demo-list.json');
}