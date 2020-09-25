(function(){

    var Heroes = {
        Hero: function Hero(name, race, cls, woe, wits, will) {
            this.name = name;
            this.race = race;
            this.class = cls;
            this.woe = woe;
            this.wits = wits;
            this.will = will;
        },

        heroes: [],

        letters: [
            ['a',.6, 'e',.5, 'i',.7, 'o',.5, 'u',.8],
            ['b',1, 'c',1, 'd',1, 'f',1, 'g',1, 'h',1,
            'j',1, 'k',1, 'l',1, 'm',1, 'n',.8, 'p',1,
            'q',1, 'r',1.1, 's',1, 't',.8, 'x',1, 'y',1,
            'w',1, 'z',1]
        ],
        races: ['human', 'dwarf', 'elf', 'orc'],
        classes: [
            { name:'knight', woe: 7, wits: 4, will: 4 },
            { name:'mage', woe: 3, wits: 6, will: 6 },
            { name:'ranger', woe: 5, wits: 5, will: 5 },
            { name:'barbarian', woe: 9, wits: 2, will: 4 },
            { name:'shaman', woe: 4, wits: 5, will: 6 }
        ],

        create: function create() {
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
                var lt = (Math.floor((letters[li].length>>1)*Math.random())<<1);
                name[j] = letters[li][lt];
                we += letters[li][lt+1]
                we += Math.random()*0.5;
            }
            var cls = classes[Math.floor(Math.random()*classes.length)];
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
                    races[Math.floor(Math.random()*races.length)],
                    cls.name,
                    woe,
                    wits,
                    will
            );
        }
    };

    Heroes.Hero.prototype.getInfo = function getInfo() {
        return `${this.name}(${this.race} ${this.class})\n - woe:${this.woe}\n - wits:${this.wits}\n - will:${this.will}`;
    };

    publish(Heroes, 'Heroes')    
})();