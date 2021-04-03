include('/lib/service/api.js');
include('/lib/data/repository.js');
(function() {
    const STORAGE_PATH = 'd:\\code\\tmp\\store';

    //#region STORE API
    function StoreApi(definition) {
        StoreApi.base.constructor.call(this, definition);
        this.repository = null;
        this.userId = 0;
        this.storeId = 10000;
        this.itemId = 20000;

        //this.fileStore = new FileStore({ path:STORAGE_PATH });
    }
    extend(ApiServer, StoreApi);
    //#endregion

    StoreApi.prototype.initialize = async function initialize() {
        this.repository = await Repository.create('./store-repo.json');
        // this.users = this.fileStore.read('users.st') || {};
        // this.stores = this.fileStore.read('stores.st') || {};
        // this.items = this.fileStore.read('items.st') || {};
    }
    
    //#region USER
    StoreApi.prototype.create_user = function create_user(user) {
        user.id = this.userId++;
        this.users[user.id] = user;
        return user;
    };

    StoreApi.prototype.retrieve_user = function retrieve_user(id) {
        return this.users[id];
    };

    StoreApi.prototype.update_user = function update_user(user) {
        var res = this.retrieve_user(user.id);
        if (res) {
            res = this.users[user.id] = user;
        }
        return res;
    };

    StoreApi.prototype.delete_user = function delete_user(id) {
        var res = this.users[id];
        if (res) {
            this.users[id] = undefined;
        }
        return res;
    };
    //#endregion

    //#region ITEM
    StoreApi.prototype.create_item = function create_item(item) {
        item.id = 20000;
        return item;
    };
    //#endregion

    //#region STORE
    StoreApi.prototype.create_store = function create_store(store) {
        store.id = 10000;
        return store;
    };

    //#endregion

    StoreApi.create = async function create(definition) {
        return await Api.Server(StoreApi, './store-service.json');
    }

    publish(StoreApi, 'StoreApi');
})();