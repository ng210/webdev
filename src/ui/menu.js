include('/ui/board.js');

(function() {
	function Menu(id, template, parent) {
        this.isSubmenu = false;
        Ui.Board.call(this, id, template, parent);
        this.effect = this.template.effect;
        this.layout = this.template.layout;
        if (!parent || parent.info.ctor != Menu) {
            this.addClass('menu');
            this.state = Ui.Menu.States.Open;
            //this.content.addClass(`${this.effect}-in`);
        } else {
            this.state = Ui.Menu.States.Closed;
            this.content.addClass(`${this.effect}-closed`);
        }        
	};
	extend(Ui.Board, Menu);
    Ui.Control.Types['menu'] = { ctor: Menu, tag: 'MENU' };

	Menu.prototype.getTemplate = function() {
		var template = Menu.base.getTemplate.call(this);
        template.type = 'menu';
        template.layout = Ui.Container.Layout.Vertical;
        template.effect = 'xfade';
        if (!template.events.includes('click')) template.events.push('click');
		return template;
    };

    Menu.prototype.render = function(ctx) {
        Ui.Menu.base.render.call(this, ctx);
        if (this.isSubmenu) {
            this.titleBar.addHandler('mouseover', Ui.Menu.onOpen);
            this.titleBar.addHandler('mouseout', Ui.Menu.onClose);
            this.content.addHandler('mouseover', Ui.Menu.onOpen);
            this.content.addHandler('mouseout', Ui.Menu.onClose);
        }
    };

    Menu.prototype.renderItems = async function(ctx) {
        this.cssText = this.cssText.replace(' menu', '');
        for (var i in this.items) {
            await this.items[i].render(ctx);
        }
    };

    Menu.prototype.add = function(key, ctrl, itemBefore) {
        if (ctrl != this.titleBar && ctrl != this.content) {
            if (ctrl.info.ctor == Ui.Menu) {
                ctrl.isSubmenu = true;
                ctrl.addClass('submenu');
            } else {
                ctrl.addClass('item');
            }
        }
        //console.log(this.id + '>>' + ctrl.id +' : ' + ctrl.css);
        Menu.base.add.call(this, key, ctrl, itemBefore);
    };

    Menu.prototype.addItem = function(key, value) {
        if (value == undefined) value = key;
        this.addNew(key, { type:'label', value: value });
    };

    Menu.onOpen = function(e) {
        var control = e.target.control;
        if (control && control.parent && control.parent.info.ctor == Ui.Menu) {
            var menu = control.parent;
            //console.log(['open', control.id, control.parent.id, menu.state]);
            if (menu.titleBar == control || menu.state == Ui.Menu.States.Closing/* && (menu.content == control || menu.content == control.parent)*/) {
                //console.log(['open', control.id, menu.state]);
                //menu.content.element.removeEventListener('animationend', Menu.onclose);
                menu.content.removeClass(`${menu.effect}-closed`);
                menu.content.addClass(`${menu.effect}-in`, true);
                menu.state = Ui.Menu.States.Open;
            }
        }        
    };

    Menu.onClose = function(e) {
        var control = e.target.control;
        if (control && control.parent && control.parent.info.ctor == Ui.Menu) {
            var menu = control.parent;
            if (menu.state == Ui.Menu.States.Open) {
                //console.log(['closing', control.id, menu.state]);
                menu.state = Ui.Menu.States.Closing;
                setTimeout( () => {
                    //console.log(['closing', control.id, menu.state]);
                    if (menu.state == Ui.Menu.States.Closing) {
                        //console.log(['close', control.id, menu.state]);
                        menu.content.removeClass(`${menu.effect}-in`);
                        menu.content.addClass(`${menu.effect}-out`, true);
                        menu.state = Ui.Menu.States.Closed;
                        menu.content.element.addEventListener('animationend', Menu.onclose);
                    }
                }, 100);
            }
        }
    };

    Menu.onclose = function(e) {
        var control = e.target.control;
        var menu = control.parent;
        menu.content.element.removeEventListener('animationend', Menu.onclose);
        menu.content.removeClass(`${menu.effect}-out`);
        menu.content.addClass(`${menu.effect}-closed`, true);
    };

    Menu.prototype.onclick = function(e) {
        var index = 0;
        for (var key in this.items) {
            var item = this.items[key];
            if (e.target.control == item) {
                var path = this.element.id.split('_');
                path.push(key);
                if (typeof onMenuSelect === 'function') {
                    onMenuSelect.call(this, path);
                }
                break;
            }
            index++;
        }
        return true;
    };

    Menu.States = {
        Closed: 'closed',
        Opening: 'opening',
        Open: 'open',
        Closing: 'closing'
    };


    Ui.Menu = Menu;
})();