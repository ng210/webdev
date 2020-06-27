include('glui/glui-lib.js');

var DemoMgr = {
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
        var res = await load(appUrl.toString() + '/' + url);
        if (res.error) {
            alert(res.error);
            return;
        }
        this.demoList = res.data;
        for (var i in this.demoList) {
            if (this.demoList.hasOwnProperty(i)) {
                var path = appUrl.toString() + '/' + this.demoList[i].path.replace(/\/\w+\.js$/, '/mini.png');
                res = await window.load(path);
                this.demoList[i].image = !res.error ? res.node : new Image(64, 64);                
            }
        }
        
        // create demo list
        var demoList = glui.create('list', {
            'type': 'Grid',
            'style': {
                'font': 'Arial 16',
                'left': '1em',
                'top': '1em',
                'width':'20em',
                'align':'right middle',
                'border':'#406080 1px inset',
                'background': '#c0e0ff',
                'color':'#101820',
                'title': {
                    'font': 'Arial 18', 'height':'1.8em',
                    'align':'center middle',
                    'border':'#406080 1px inset',
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
        demoList.dataBind(this.demoList);

        demoList.setVisible(true);
        glui.buildUI();
        glui.setRenderingMode(glui.Render2d);
        glui.render();
        glui.animate();
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
                    'width':'65%', 'background': '#406080', 'border':'#406080 1px outset'
                } },
                'value': { 'type': 'Textbox', 'look': 'potmeter', 'data-type': 'float', 'decimal-digits': 3, 'data-field': 'value', 'column': '$Key', 'style': {
                    'width':'35%', 'background': '#d0e0f0', 'border':'#80a890 1px inset'
                } }
            }
        }, null, demo);
        this.controls.settings.dataBind(demo.settings);
        for (var ri=0; ri<this.controls.settings.rowKeys.length; ri++) {
            var key = this.controls.settings.rowKeys[ri];
            demo.settings[key].control = this.controls.settings.rows[key].cells.value;
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
        glui.setRenderingMode(glui.Render2d);
        this.demo = demo;
        if (typeof demo.initialize === 'function') {
            demo.initialize();
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
            lock('RUN', () => {
                var dt = new Date().getTime() - this.time;
                this.totalTime += dt;
                this.demo.update(this.frame, dt);
                this.demo.render(this.frame);
                glui.render();
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
    stop: async function stop() {
        return lock('RUN', () => {
            this.isRunning = false
            cancelAnimationFrame(this.animationId);
        });
    },

    resize: function resize(e) {
        this.demo.resize();
        this.demo.render(this.frame, 0);
        var top = 200, left = 20;
        var width = Math.max(this.controls.title.width, this.controls.settings.width, this.controls.start.width);
        this.controls.title.move(left + (width - this.controls.title.width)/2, top);
        top += this.controls.title.height + 4;
        this.controls.settings.move(left + (width - this.controls.settings.width)/2, top);
        top += this.controls.settings.height + 8;
        this.controls.start.move(left + (width - this.controls.start.width)/2, top);
        glui.render();
    },

    onclick: async function onclick(e, ctrl) {
        switch (ctrl.id) {
            case 'start':
                this.isRunning = !this.isRunning;
                ctrl.value = this.isRunning ? 'Stop' : 'Start';
                ctrl.render();
                this.time = new Date().getTime();
                this.run();
                break;
            case 'list': {
                if (e.control.row) {
                    var ri = e.control.row.id;
                    if (ri >= 0) {
                        if (this.demo) {
                            // destroy demo
                            await this.stop();
                            for (var i in this.controls) {
                                glui.remove(this.controls[i]);
                            }
                        }
                        var path = ctrl.dataSource[ri].path;
                        // load and run demo
                        var demo = await DemoMgr.load(path);
                        if (demo instanceof Error) {
                            alert(demo.message);
                        } else {
                            DemoMgr.time = new Date().getTime();
                            //this.isRunning = true;
                            DemoMgr.run(demo);
                        }
                    }
                }
                break;
            }
        }
    },
    onchange: function onchange(e, ctrl) {
        this.demo.render(this.frame);
        glui.render();
    }
};

async function onpageload(e) {
    if (e.length) {
        alert(e.join('\n'));
    }
    glui.scale.x = 0.6;
    glui.scale.y = 0.6;
    glui.initialize();
    var cvs = glui.canvas;
    cvs.style.backgroundColor = '203040';
    window.addEventListener('resize', () => DemoMgr.resize());

    DemoMgr.initialize('demo-list.json');
}