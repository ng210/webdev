include('/ui/valuecontrol.js');
(function() {

    function DropDownList(id, template, parent) {
        Ui.ValueControl.call(this, id, template, parent);
        this.items = this.template.items;
        this.itemsChanged = true;
        this.itemKey = this.template['item-key'];
        this.itemValue = this.template['item-value'];
        this.selectedItem = null;
        this.value = -1;
    };
	extend(Ui.ValueControl, DropDownList);

    Ui.Control.Types['ddlist'] = { ctor: DropDownList, tag: 'SELECT' };

    DropDownList.prototype.getTemplate = function() {
        var template = DropDownList.base.getTemplate.call(this);
        template.type = 'ddlist';
        template.items = [];
        template['item-key'] = '$key';
        template['item-value'] = false;
        if (!template.events.includes('change')) template.events.push('change');
        return template;
    };

    DropDownList.prototype.dataBind = function(dataSource, dataField) {
        DropDownList.base.dataBind.call(this, dataSource, dataField);
        this.itemsChanged = true;
    };

    DropDownList.prototype.render = async function(ctx) {
        Ui.Control.prototype.render.call(this, ctx);
        if (this.itemsChanged || ctx.force) {
            // remove all options
            while (this.element.options.length > 0) {
                this.element.remove(0);
            }
            // add current options
            var ix = 0;
            for (var key in this.items)	{
                if (this.items.hasOwnProperty(key)) {
                    var item = this.items[key];
                    var option = document.createElement("option");
                    option.value = DropDownList.resolveReference(this.itemValue, item, key, ix);
                    option.text = DropDownList.resolveReference(this.itemKey, item, key, ix);
                    this.element.add(option);
                    ix++;
                }
            }
            this.itemsChanged = false;
        }
        this.element.selectedIndex = this.findIndex(this.getValue());
    };

	DropDownList.prototype.registerHandler = function(event) {
		if (['change', 'click'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
	};

    DropDownList.prototype.onchange = function(e) {
        var selection = this.element.options[this.element.selectedIndex];
        this.selectedItem = this.items[selection.value];
        this.setValue(selection.value);
    };

    DropDownList.prototype.add = function(key, value) {
        this.items[key] = value;
        this.itemsChanged = true;
        if (this.element) {
            this.render();
        }
    };

    // DropDownList.prototype.setValue = function(value) {
    //     this.element.selectedIndex = this.findIndex(value);
    //     DropDownList.base.setValue.call(this, value);
    // };

    DropDownList.prototype.setItems = function(list) {
        this.items = {};
        for (var key in list) {
            if (list.hasOwnProperty(key)) {
                this.items[key] = list[key];
            }
        }
        this.itemsChanged = true;
        if (this.element) {
            this.render();
        }
    };

    DropDownList.prototype.select = function(value) {
        this.element.selectedIndex = this.findIndex(value);
        Ui.Control.onevent({type:'change', target:this.element});
        //this.element.dispatchEvent(new Event('change'));
    };

    DropDownList.prototype.findIndex = function(value) {
        var index = -1;
        var ix = 0;
        for (var key in this.items) {
            if (this.items.hasOwnProperty(key)) {
                itemValue = DropDownList.resolveReference(this.itemValue, this.items[key], key, ix);
                if (value == itemValue) {
                    index = ix;
                    break;
                }
                ix++;
            }
        }
        return index;
    };

    DropDownList.prototype.getSelected = function() {
        var ix = 0;
        var item = null;
        var key = null;
        for (key in this.items) {
            if (ix == this.element.selectedIndex) {
                item = this.items[key];
                break;
            }
        }
        return {key: key, value: item};
    };

    DropDownList.resolveReference = function(ref, obj, key, index) {
        if (ref == '$key') return key;
        if (ref == '$Key') return key.charAt(0).toUpperCase() + key.substring(1);
        if (ref == '$index') return index;
        if (ref === false) return obj;
        return obj[ref];
    };

    Ui.DropDownList = DropDownList;
})();
