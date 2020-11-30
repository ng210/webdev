(function(){

    function Hero(name, race, cls, woe, wits, will) {
        this.name = name;
        this.race = race;
        this.class = cls;
        this.woe = woe;
        this.wits = wits;
        this.will = will;
    }

    Object.defineProperties(Hero.prototype, {
        'type': {
            enumerable: true,
            configurable: false,
            get: function() { return `${this.race} ${this.class}`}
        }
    });

    // Hero.prototype.getInfo = function getInfo() {
    //     return `${this.name}(${this.race} ${this.class})\n - woe:${this.woe}\n - wits:${this.wits}\n - will:${this.will}`;
    // };

    function Heroes() {
        Demo.call(this, 'Heroes', {
		});

        this.heroes = [];
        this.table = null;
        this.letters = [
            ['a',.6, 'e',.5, 'i',.7, 'o',.5, 'u',.8],
            ['b',1, 'c',1, 'd',1, 'f',1, 'g',1, 'h',1,
            'j',1, 'k',1, 'l',1, 'm',1, 'n',.8, 'p',1,
            'q',1, 'r',1.1, 's',1, 't',.8, 'x',1, 'y',1,
            'w',1, 'z',1]
        ];
        this.races = ['human', 'dwarf', 'elf', 'orc'];
        this.classes = [
            { name:'knight', woe: 7, wits: 4, will: 4 },
            { name:'mage', woe: 3, wits: 6, will: 6 },
            { name:'ranger', woe: 5, wits: 5, will: 5 },
            { name:'barbarian', woe: 9, wits: 2, will: 4 },
            { name:'shaman', woe: 4, wits: 5, will: 6 }
        ];
    };
    extend(Demo, Heroes);

    Heroes.prototype.create = function create() {
        // generate a name with length 3-7
        var name = new Array(3+Math.floor(Math.random()*4));
        var li = Math.floor(Math.random()*2);
        var we = 0;
        for (var j=0; j<name.length;j++)
        {
            if (we >= 1)
            {
                li = 1 - li;
                we -= 1;
            }
            var lt = (Math.floor((this.letters[li].length>>1)*Math.random())<<1);
            var ch = this.letters[li][lt];
            name[j] = j == 0 ? ch.toUpperCase() : ch;
            we += this.letters[li][lt+1]
            we += Math.random()*0.5;
        }
        var cls = this.classes[Math.floor(Math.random()*this.classes.length)];
        var clsSum = 2*(cls.woe + cls.wits + cls.will);
        var woe = Math.floor(cls.woe*(1+Math.random()));
        var wits = Math.floor(cls.wits*(1+Math.random()));
        var will = Math.floor(cls.will*(1+Math.random()));
        var rate = clsSum/(woe + wits + will);
        woe = Math.floor(woe*rate);
        wits = Math.floor(wits*rate);
        will = clsSum - woe - wits;

        return new Hero(
                name.join(''),
                this.races[Math.floor(Math.random()*this.races.length)],
                cls.name,
                woe,
                wits,
                will
        );
    };
    Heroes.prototype.initialize = async function initialize() {
        this.heroes = [];
        for (var i=0; i<10; i++) {
            this.heroes.push(this.create());
        }
        this.table = await glui.create('heroes', {
            'type': 'Table',
            'style': {
                'font': 'Arial 14',
                'width':'40em',
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
                },
                'header': {
                    'font': 'Arial 12', 'height':'1.6em',
                    'align':'center middle',
                    'border':'#80a0d0 1px outset',
                    'background': '#80a0d0'
                }
            },
            'header': true,
            'title': 'Heroes',
            'row-template': {
                'name': { 'type': 'Textbox', 'column': '$Key', 'style': {
                    'width':'40%', 'background': '#d0e0f0', 'border':'#80a890 1px outset'
                } },
                'type': { 'type': 'Label', 'column': '$Key', 'style': {
                    'width':'30%', 'background': '#406080', 'border':'#406080 1px inset'
                } },
                'Wits': { 'type': 'Textbox', 'column': '$Key', 'data-type': 'int', 'data-field': 'wits', 'style': {
                    'width':'10%', 'background': '#d0e0f0', 'border':'#80a890 1px outset'
                } },
                'Will': { 'type': 'Textbox', 'column': '$Key', 'data-type': 'int', 'data-field': 'will', 'style': {
                    'width':'10%', 'background': '#d0e0f0', 'border':'#80a890 1px outset'
                } },
                'Woe': { 'type': 'Textbox', 'column': '$Key', 'data-type': 'int', 'data-field': 'woe', 'style': {
                    'width':'10%', 'background': '#d0e0f0', 'border':'#80a890 1px outset'
                } },
            },
            'data-source': 'heroes'
        }, null, this);
        DemoMgr.controls.heroesTable = this.table;

        await this.table.build();
        this.resize();
    };
    Heroes.prototype.update = function update() {

    };
    Heroes.prototype.render = function render() {

    };
    Heroes.prototype.resize = function resize() {
        this.table.move((glui.screen.width - this.table.width)/2, (glui.screen.height - this.table.height)/2);
        this.table.render();
        glui.repaint();
    };

    publish(new Heroes(), 'Heroes')    
})();