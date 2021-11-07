include('/lib/data/dictionary.js');
include('/lib/data/stream.js');

(function() {
    //#region ENTITY
    function Entity(id, name) {
        this.id = id;
        this.name = name;
    }
    Entity.prototype.fromData = function fromData(stream) {
        this.id = stream.readUint32(0);
        this.name = stream.readString(4);
        stream.readPosition += 64 - this.name.length;
    };
    Entity.prototype.toData = function(stream) {
        stream.writeUint32(this.id).writeString(this.name);
        var padding = 64 - this.name.length;
        if (padding > 0) {
            stream.writeBytes(0, padding);
        }
    };

    Entity.prototype.fromView = function fromView(obj) {
        this.id = obj.id;
        this.name = obj.name;
    };
    Entity.prototype.toView = function() {
        return {
            id: this.id,
            name: this.name
        };
    };
    //#endregion

    //#region USER
    function User(id, name, password) {
        User.base.constructor.call(this, id || User.id++, name);
        var password = password || this.createPassword();
        this.groups = [];
    };
    extend(Entity, User);
    User.id = 1;

    User.prototype.createPassword = function createPassword() {
        var code = [];
        for (var i=0; i<16; i++) {
            code.push(String.fromCharCode(Math.floor(32 + 64*Math.random())));
        }
        this.password = btoa(code.join(''));
        return this.password;
    };
    User.prototype.hasAccess = function hasAccess(right) {
        var result = false;
        var groups = Array.from(this.groups);
        while (groups.length > 0) {
            var grp = groups.pop();
            if (grp.rights.find(x => x.name == right) != null) {
                result = true;
                break;
            }
            if (grp.parent) groups.push(grp.parent);
        }
        return result;
    };

    User.prototype.fromData = function fromData(stream) {
        User.base.fromData.call(this, stream);
        this.password = stream.readString(20);
        stream.readPosition += 16 - this.password.length;
    };
    User.prototype.toData = function(stream) {
        User.base.toData.call(this, stream);
        stream.writeUint32(this.id).writeString(this.name);
        var padding = 16 - this.password.length;
        if (padding > 0) {
            stream.writeBytes(0, padding);
        }
    };

    User.prototype.fromView = function(obj) {
        obj.id = obj.id || User.id++;
        User.base.fromView.call(this, obj);
        if (obj.groups) this.groups = obj.groups;
    };
    User.prototype.toView = function() {
        var obj = User.base.toView.call(this);
        obj.password = this.password;
        obj.groups = this.groups.map(x => x.id);
        return obj;
    };

    //#endregion

    //#region GROUP
    function Group(id, name, parent) {
        Group.base.constructor.call(this, id || Group.id++, name);
        this.rights = [];
        this.users = new Dictionary();
        this.subgroups = new Dictionary();
        this.parent = parent;
    }
    extend(Entity, Group);
    Group.id = 1;

    Group.prototype.addRight = function addRight(right) {
        if (!this.rights.includes(right)) this.rights.push(right);
    };
    Group.prototype.addUser = function addUser(user) {
        this.users.add(user.id, user);
        if (!user.groups.includes(this)) {
            user.groups.push(this);
        }
    };
    Group.prototype.addGroup = function addGroup(group) {
        this.subgroups.add(group.id, group);
        group.parent = this;
    };

    Group.prototype.toData = function(stream) {
        Group.base.toData.call(this, stream);
        stream.writeUint32(this.parent ? this.parent.id : 0);
    };

    Group.prototype.toView = function() {
        var obj = Group.base.toView.call(this);
        obj.parent = this.parent ? this.parent.name : '';
        obj.users = this.users.values(x => x.name);
        obj.subgroups = this.subgroups.values(x => x.name);
        obj.rights = this.rights.map(x => x.name);
        return obj;
    };
    //#endregion

    //#region DOMAIN
    function Domain(id, name, parent) {
        Domain.base.constructor.call(this, id || Domain.id++, name);
        this.parent = parent;
    }
    extend(Entity, Domain);
    Domain.id = 1;

    Domain.prototype.toData = function(stream) {
        Domain.base.toData.call(this, stream);
        stream.writeUint32(this.parent ? this.parent.id : 0);
    };

    Domain.prototype.fromView = function fromView(obj) {
        obj.id = obj.id || Domain.id++;
        Domain.base.fromView.call(this, obj);
        this.parent = obj.parent;
    };
    Domain.prototype.toView = function() {
        var obj = Domain.base.toView.call(this);
        obj.parent = this.parent ? this.parent.id : 0;
        return obj;
    };
    //#endregion

    //#region RIGHT
    function Right(id, name) {
        Right.base.constructor.call(this, id, name);
    }
    extend(Entity, Right);
    Right.id = 1;
    //#endregion

    //#region ITEM
    function Item(id, name, domain, right) {
        Item.base.constructor.call(this, id, name);
        this.slot = 0;
    }
    extend(Entity, Item);
    Item.id = 1;

    Item.prototype.toData = function(stream) {
        Item.base.toData.call(this, stream);
        stream.writeUint32(this.domain ? this.domain.id : 0);
        stream.writeUint32(this.right ? this.right.id : 0);
    };

    Item.prototype.toView = function() {
        var obj = Item.base.toView.call(this);
        obj.domain = this.domain ? this.domain.name : 0;
        obj.right = this.right ? this.right.name : 0;
        return obj;
    };
    //#endregion

    var model = {
        'Entity': Entity,
        'User': User,
        'Group': Group,
        'Right': Right,
        'Domain': Domain,
        'Item': Item,

    };

    publish(model, 'Model');
})();



