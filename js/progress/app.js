function App() {
    this.ui = {
        table: null,
        diagram: null
    };
    this.data = null;
    this.points = null;
    this.unitX = 60;
    this.unitY = 10;
}

App.prototype.createUi = async function createUi() {
    this.ui = await glui.create('ui', {
        'type': 'Container',
        'style': {
            'width': '100%', 'height': '100%',
            'background': '#102040',
            'border': '#102040 4px inset'
        }
    }, null, this);

    this.table = await glui.create('data', {
        'type': 'Table',
        'style': {
            'font': 'Arial 12',
            'width':'27em',
            'align':'right middle',
            'border':'#406080 2px outset',
            'background': '#c0e0ff',
            'color':'#101820',
            'cell': {
                'height': '1.5em',
                'background': '#e0e8ff',
                'border':'#406080 1px inset'
            },
            'title': {
                'font': 'Arial 18', 'height':'1.8em',
                'align':'center middle',
                'border':'#406080 1px inset',
                'background': '#a0c0ff'
            }
        },
        'title': 'Data',
        'row-template': {
            //'no': { 'type': 'Label', 'style': { 'width':'2em', 'background': '#406080' } },
            'datum': { 'type': 'Textbox', 'multi-line': false, 'data-type': 'string', 'style': { 'width':'16em' } },
            'sis': { 'type': 'Textbox', 'multi-line': false, 'max':300, 'data-type': 'int', 'style': { 'width':'4em' } },
            'dias': { 'type': 'Textbox', 'multi-line': false, 'max':300, 'data-type': 'int', 'style': { 'width':'4em' } },
            'puls': { 'type': 'Textbox', 'multi-line': false, 'max':300, 'data-type': 'int', 'style': { 'width':'3em' } },
        }
    }, this.ui, this);

    this.diagram = await glui.create('diagram', {
        'type': 'Grid',
        'style': {
            'color': '#a08060',
            'background': '#102040',
            'width': '100%', 'height': '100%',
            'border': '#102040 2px inset',
            'left': '32em'
        },
        'unit-x': this.unitX,
        'unit-y': this.unitY,
        'scale-x': 0.4,
        'scale-y': 1,
        'insert-mode': 'none',
        'drag-mode': 'none',
        'curve-mode': 'line'
    }, this.ui, this);
};

App.prototype.loadData = async function loadData() {
    var res = await load('/progress/data.json');
    if (res.error) alert('Load error: ' + res.error.message);
    else {
        this.data = res.data;
        this.transformData();
    }
};
App.prototype.transformData = function transformData() {
    this.points = [];
    var start = Math.floor(new Date(this.data[0].datum).getTime()/60000);
    var unitX = this.unitX, unitY = this.unitY;
    for (var i=0; i<this.data.length; i++) {
        var r = this.data[i];
        var d = Math.floor(new Date(r.datum).getTime()/60000) - start;
        var point = [d/unitX, r.sis/unitY, r.dias/unitY, r.puls/unitY];
        this.points.push(point);
    }
};
App.prototype.paint = function paint() {
    this.ui.render();
};
App.prototype.refresh = async function refresh() {
    this.table.dataBind(this.data);
    await this.table.build();
    this.diagram.dataBind(this.points);
};