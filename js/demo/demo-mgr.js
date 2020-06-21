include('glui/glui-lib.js');

var DemoMgr = {
    demo: null,
    isRunning: true,
    frame: 0,
    time: 0,
    controls: {},

    buildUI: function buildUI(demo) {
        glui.buildUI(demo);

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
            'value': 'Stop'
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
        this.frame = 0;
        demo.resize();
        this.controls.settings.getBoundingBox();
        this.resize();
        return demo;
    },
    run: function run() {
        if (this.isRunning) {
            var dt = new Date().getTime() - this.time;
            this.demo.update(this.frame, dt);
            this.demo.render(this.frame);
            glui.render();
            this.time = new Date().getTime();
            this.frame++;
            requestAnimationFrame(() => this.run());
        }        
    },    
    resize: function resize(e) {
        this.demo.resize();
        this.demo.render(this.frame, 0);
        var top = 20, left = 20;
        var width = Math.max(this.controls.title.width, this.controls.settings.width, this.controls.start.width);
        this.controls.title.move(left + (width - this.controls.title.width)/2, top);
        top += this.controls.title.height + 4;
        this.controls.settings.move(left + (width - this.controls.settings.width)/2, top);
        top += this.controls.settings.height + 8;
        this.controls.start.move(left + (width - this.controls.start.width)/2, top);
    },

    onclick: function onclick(e, ctrl) {
        if (ctrl.id == 'start') {
            this.isRunning = !this.isRunning;
            ctrl.value = this.isRunning ? 'Stop' : 'Start';
            ctrl.render();
            this.time = new Date().getTime();
            this.run();
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

    // create demo list

    // load and run demo
    var demo = await DemoMgr.load('timestable/timestable.js');
    //var demo = await DemoMgr.load('plasma/plasma.js');
    if (demo instanceof Error) {
        alert(demo.message);
    } else {
        DemoMgr.time = new Date().getTime();
        DemoMgr.run(demo);
    }
}