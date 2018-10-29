(function()  {
    function Setting(config) {
        this.id = config.id;
        this.type = config.type;
        this.element = null;
        this.trigger = [];
        switch (this.type) {
            case Setting.VALUE:
                this.min = config.min || 0.0;
                this.max = config.max || 1.0;
                this.step = config.step;
                this.element = document.createElement('INPUT');
                this.element.onchange = Setting.onchange;
                break;
            case Setting.LIST:
                this.items = config.items;
                this.element = document.createElement('SELECT');
                for (var i=0; i<this.items.length; i++) {
                    var option = document.createElement("option");
                    option.text = this.items[i];
                    option.value = i;
                    this.element.add(option);
                }
                this.element.onchange = Setting.onchange;
                break;
        }
        this.element.setting = this;
        this.value = config.value || 0.0;
        this.constructor = Setting;
    }
    Setting.prototype.render = function() {

    };
    Setting.prototype.getValue = function() {
        var v = 0;
        switch (this.type) {
            case Setting.VALUE:
                v = this.element.value;
                break;
            case Setting.LIST:
                v = this.items[this.element.selectedIndex];
                break;
        }
        return v;
    };
    Setting.prototype.setValue = function(v) {
        switch (this.type) {
            case Setting.VALUE:
                this.element.value = v;
                break;
            case Setting.LIST:
                // set by value
                this.element.selectedIndex = v;
                break;
        }
    };
    Setting.VALUE = 'value';
    Setting.LIST = 'list';
    Setting.onchange = function(e) {
        var setting = e.target.setting;
        setting.demo.onsettingchanged(setting);
    };

    var DemoUI = {
        initialize: function(node, demo) {
            while (node.children.length > 0) {
                node.removeChild(node.children[0]);
            }
            demo.settings = {};
            var tab = document.createElement('TABLE');
            tab.className = 'setting';
            var tr = document.createElement('TR');
            var td = document.createElement('TD');
            td.className = 'setting-header';
            td.innerHTML = '<b>' + demo.id + '</b>';
            tr.appendChild(td);
            tab.appendChild(tr);
            var keys = Object.keys(demo.config);
            keys.forEach( key => {
                var setting = new Setting(demo.config[key]);
                setting.setValue(demo.config[key].value || 0);
                setting.demo = demo;
                demo.settings[key] = setting;
                tr = document.createElement('TR');
                td = document.createElement('TD');
                td.className = 'setting-label';
                td.innerHTML = key;
                tr.appendChild(td);
                td = document.createElement('TD');
                td.className = 'setting-value';
                td.appendChild(setting.element);
                tr.appendChild(td);
                tab.appendChild(tr);
            });
            node.appendChild(tab);
            return settings;
        }
    };

    public(DemoUI, 'DemoUI');
})();