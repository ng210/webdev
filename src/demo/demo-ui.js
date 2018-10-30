(function()	 {
	function Setting(demo, configKey) {
		var config = demo.config[configKey];
		this.id	= configKey;
		this.type =	config.type;
		this.element = null;
		this.trigger = [];
		switch (this.type) {
			default:
			case Setting.VALUE:
				this.min = config.min || 0.0;
				this.max = config.max || 1.0;
				this.step =	config.step;
				this.element = document.createElement('INPUT');
				this.element.setAttribute('type', 'text');
				this.element.setAttribute('size', 4);
				break;
			case Setting.LIST:
				this.items = [];
				this.element = document.createElement('SELECT');
				for	(var i=0; i<config.items.length; i++)	{
					var configItem = config.items[i];
					var item = {};
					var	option = document.createElement("option");
					if (Array.isArray(config.items[i])) {
						item.key = configItem[0];
						item.value = configItem[1];						
					} else {
						item.key = item.value = configItem;
					}
					item.index = i;
					option.text = item.key;
					option.value = item.value;
					this.element.add(option);
					this.items.push(item);
				}
				break;
			case Setting.RANGE:
				this.min = config.min || 0.0;
				this.max = config.max || 1.0;
				this.step =	config.step;
				this.element = document.createElement('INPUT');
				this.element.setAttribute('type', 'range');
				this.element.setAttribute('min', this.min);
				this.element.setAttribute('max', this.max);
				this.element.setAttribute('step', this.step);
				break;
		}
		this.element.id = demo.id + '#' + this.id;
		this.element.className = ['settings value', demo.id, this.id, this.type].join(' ');
		this.element.onchange =	Setting.onchange;
		this.element.setting = this;
		this.value = config.value || 0.0;
		this.constructor = Setting;
	}
	Setting.prototype.render = function() {

	};
	Setting.prototype.getValue = function()	{
		var	v =	0;
		switch (this.type) {
			default:
			case Setting.RANGE:
			case Setting.VALUE:
				v =	this.element.value;
				break;
			case Setting.LIST:
				var item = this.items[this.element.selectedIndex];
				v =	{ key: item.key, value: item.value, index:item.index };
				break;
		}
		return v;
	};
	Setting.prototype.setValue = function(v) {
		switch (this.type) {
			default:
			case Setting.RANGE:
			case Setting.VALUE:
				this.element.value = v;
				break;
			case Setting.LIST:
				// set by value
				this.element.selectedIndex = v;
				break;
		}
	};
	Setting.VALUE =	'value';
	Setting.LIST = 'list';
	Setting.RANGE = 'range';
	
	Setting.onchange = function(e) {
		var	setting	= e.target.setting;
		setting.demo.onsettingchanged(setting);
	};

	var	DemoUI = {
		initialize:	function(node, demo) {
			while (node.children.length	> 0) {
				node.removeChild(node.children[0]);
			}
			demo.settings =	{};
			var	tab	= document.createElement('TABLE');
			tab.className =	'settings';
			var	tr = document.createElement('TR');
			var	td = document.createElement('TD');
			td.setAttribute('colspan', 2);
			td.className = 'settings header';
			td.innerHTML = '<b>' + demo.id + '</b>';
			tr.appendChild(td);
			tab.appendChild(tr);
			var	keys = Object.keys(demo.config);
			keys.forEach( key => {
				var	setting	= new Setting(demo, key);
				setting.setValue(demo.config[key].value	|| 0);
				setting.demo = demo;
				demo.settings[key] = setting;
				tr = document.createElement('TR');
				td = document.createElement('TD');
				td.className = 'settings label';
				td.innerHTML = key;
				tr.appendChild(td);
				td = document.createElement('TD');
				td.className = 'settings value';
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