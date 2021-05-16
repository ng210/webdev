include('/lib/service/api.js');
include('/lib/data/repository.js');
include('./model/model.js');
include('./data/file-access.js');

(function() {
    function StoreApi(definition) {
        StoreApi.base.constructor.call(this, definition);
        this.repository = null;
        this.domainId = 0;
        this.groupId = 1000;
        this.userId = 2000;
        this.itemId = 3000;
        this.publicGroup = null;
        this.dataAccess = new FileAccess();
    }
    extend(ApiServer, StoreApi);

    StoreApi.prototype.initialize = async function initialize() {
        try {
            this.repository = await Repository.create('./api/store-repo.json');
            // add default rights
            var adminRight = this.create('Right', 'admin');
            this.create('Right', 'create');
            var readRight = this.create('Right', 'read');
            this.create('Right', 'update');
            this.create('Right', 'delete');

            // add default users
            var admin = this.create('User', 'admin');
            admin.password = btoa('admin');
            var guest = this.create('User', 'guest');

            // add default groups
            var adminGroup = this.create('Group', 'admins');
            adminGroup.addRight(adminRight);
            adminGroup.addUser(admin);

            this.publicGroup = this.create('Group', 'public');
            this.publicGroup.addRight(readRight);

            this.publicGroup.addGroup(adminGroup);
            this.publicGroup.addUser(guest);

            // add resource rights
            for (var ri=0; ri<this.definition.Resources.length; ri++) {
                var res = this.definition.Resources[ri];
                for (var mi=0; mi<res.methods.length; mi++) {
                    var method = res.methods[mi].toLowerCase();
                    var right = this.create('Right',`${method}_${res.type.toLowerCase()}`);
                    if (method == 'read') {
                        this.publicGroup.addRight(right);
                    } else {
                        adminGroup.addRight(right);
                    }
                }
            }

            // add default domain
            this.create('Domain', 'public');

            // read data files
            var users = this.dataAccess.read('users.dt');
debugger
            var groups = this.dataAccess.read('groups.dt');
            var rights = this.dataAccess.read('rights.dt');
            var domains = this.dataAccess.read('domains.dt');
            var items = this.dataAccess.read('items.dt');

        
        } catch (err) {
            var text = err.message;
            if (err.details) text += err.details;
            throw new Error(text);
        }
    };
    StoreApi.prototype.checkAccess = function checkAccess(endpoint, identity, req, resp) {
        var granted = false;
        var user = this.repository.get('DbUser', 'id', identity);
        if (!user) {
            resp.statusCode = 401;
        } else {
            granted = user.hasAccess(endpoint.access);
        }
        return granted;
    };

    StoreApi.prototype.login = function login(id, passw) {
        var token = null;
        var user = this.repository.get('DbUser', 'name', id);
        if (user && btoa(passw) == user.password) {
            token = this.createToken(user.id);
        }
        return token;
    };

    StoreApi.prototype.create = function create(typeName, name) {
        var obj = Reflect.construct(Model[typeName], [Model[typeName].id++, name]);
        this.repository.add(obj, 'Db' + typeName);
        return obj;
    };

    //#region ENTITY
    StoreApi.prototype.getOrCreateEntity = function getOrCreateEntity(typeName, obj, req, resp) {
        var entity = null;
        var dbTypeName = 'Db' + typeName;
        entity = this.repository.get(dbTypeName, 'name', obj.name);
        if (!entity) {
            try {
                entity = new Model[typeName]();
                obj.id = entity.id;
                entity.fromView(obj);
                this.repository.add(entity, dbTypeName);
                this.updateEntity(typeName, entity, req, resp);
            } catch (err) {
                resp.statusCode = 500;
                resp.error = err;
            }
        } else {
            resp.statusCode = 409;
        }
        return entity;
    };
    StoreApi.prototype.readEntity = function readEntity(typeName, id, req, resp) {
        var entity = this.repository.get('Db' + typeName, 'id', id);
        if (!entity) resp.statusCode = 404;
        return entity;
    };
    StoreApi.prototype.updateEntity = function updateEntity(typeName, obj, req, resp) {
        var result = obj;
        var dbTypeName = 'Db' + typeName;
        var entity = this.repository.get(dbTypeName, 'id', obj.id);
        if (entity) {
            entity.fromView(obj);
            var results = this.repository.updateLinks(entity, dbTypeName);
            if (results.length > 0) {
                resp.statusCode = 400;
                resp.error = new Error('Could not update links!');
                resp.error.details = results;
            }
            result = entity;
        } else {
            resp.statusCode = 404;
        }

        return result;
    };
    StoreApi.prototype.deleteEntity = function deleteEntity(typeName, id, req, resp) {
        var entity = this.repository.remove('Db' + typeName, 'id', id);
        if (!entity) resp.statusCode = 404;
        return entity;
    };
    //#endregion

    //#region USER
    StoreApi.prototype.create_user = function create_user(obj, req, resp) {
        var user = this.api.getOrCreateEntity('User', obj, req, resp);
        if (resp.statusCode == 200) this.api.updateUser(user, obj, req, resp);
        return user ? user.toView() : obj;
    };
    StoreApi.prototype.read_user = function read_user(id, req, resp) {
        var user = this.api.readEntity('User', id, req, resp);
        return user ? user.toView() : null;
    };
    StoreApi.prototype.update_user = function update_user(obj, req, resp) {
        var user = this.api.updateEntity('User', obj, req, resp);
        this.api.updateUser(user, obj, req, resp);
        return user ? user.toView() : obj;
    };
    StoreApi.prototype.delete_user = function delete_user(id, req, resp) {
        var user = this.api.deleteEntity('User', id, req, resp);
        // update groups
        for (var i=0; i<user.groups.length; i++) {
            var group = user.groups[i];
            group.users[user.id] = undefined;
        }
        return user ? user.toView() : null;
    };

    StoreApi.prototype.get_users = function get_users(req, resp) {
        return this.api.repository.data.DbUser.map(x => x.toView());
    };
    StoreApi.prototype.updateUser = function updateUser(user, obj, req, resp) {
        var groups = obj.groups;
        var hasErrors = false;
        if (groups && Array.isArray(groups)) {
            for (var i=0; i<groups.length; i++) {
                var group = this.repository.get('DbGroup', 'id', groups[i]);
                if (group) {
                    user.groups.push(group);
                    group.addUser(user);
                }
                else hasErrors = true;
            }
        }
        if (hasErrors) resp.statusCode = 400;
    };
    //#endregion

    //#region DOMAIN
    StoreApi.prototype.create_domain = function create_domain(obj, req, resp) {
        var domain = this.api.getOrCreateEntity('Domain', obj, req, resp);
        return domain ? domain.toView() : obj;
    };
    StoreApi.prototype.read_domain = function read_domain(id, req, resp) {
        var domain = this.api.readEntity('Domain', id, req, resp);
        return domain ? domain.toView() : null;
    };
    StoreApi.prototype.update_domain = function update_domain(obj, req, resp) {
        var domain = this.api.updateEntity('Domain', obj, req, resp);
        return domain ? domain.toView() : obj;
    };
    StoreApi.prototype.delete_domain = function delete_domain(id, req, resp) {
        var domain = this.api.deleteEntity('Domain', id, req, resp);
        return domain ? domain.toView() : null;
    };

    StoreApi.prototype.get_domains = function get_domains(req, resp) {
        return this.api.repository.data.DbDomain.map(x => x.toView());
    };
    //#endregion

    //#region GROUP
    StoreApi.prototype.create_group = function create_group(obj, req, resp) {
        var group = this.api.getOrCreateEntity('Group', obj, req, resp);
        return group ? group.toView() : obj;
    };
    StoreApi.prototype.read_group = function read_group(id, req, resp) {
        var group = this.api.readEntity('Group', id, req, resp);
        return group ? group.toView() : null;
    };
    StoreApi.prototype.update_group = function update_group(obj, req, resp) {
        var group = this.api.updateEntity('Group', obj, req, resp);
        return group ? group.toView() : obj;
    };
    StoreApi.prototype.delete_group = function delete_group(id, req, resp) {
        var group = this.api.readEntity('Group', id, req, resp);
        if (group) {
            if (group.users.length == 0 && group.subgroups.length == 0) {
                group = this.api.deleteEntity('Group', id, req, resp);
            } else {
                resp.statusCode = 400;
                resp.error = new Error('Group is not empty!');
            }
        }
        return group ? group.toView() : null;
    };

    StoreApi.prototype.get_groups = function get_groups(req, resp) {
        return this.api.repository.data.DbGroup.map(x => x.toView());
    };
    //#endregion

    // StoreApi.prototype.toEntityList = function toEntityList(typeName) {
    //     var list = this.repository.data[typeName];
    //     var entityList = [];
    //     for (var i=0; i<list.length; i++) {
    //         entityList.push(list[i].toEntity());
    //     }
    //     return entityList;
    // };

    // StoreApi.prototype.tryUpdate = function tryUpdate(typeName, data) {
    //     var hasFound = false;
    //     var obj = this.repository.get(typeName, 'name', data.name);
    //     if (obj) {
    //         obj = this.update(obj, data);
    //         hasFound = true;
    //     }
    //     result.obj = obj.toEntity();
    //     return hasFound;
    // };

    StoreApi.create = async function create(definition) {
        return await Api.Server(StoreApi, definition);
    };
    publish(StoreApi, 'StoreApi');
})();