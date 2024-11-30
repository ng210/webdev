include('repository.js');

(function() {
    async function test_Repository() {
        header('Test Repository');
        Item.prototype.toString = function toString() {
            var first = this.size.charAt(0);
            var pre = vowels.includes(first) && first != 'u' ? 'an' : 'a';
            return `${pre} ${this.size} ${this.color} ${this.material} ${this.type}`;
        };
        function rnd(range) {
            return Math.floor(range*Math.random());
        }
        var consonants = 'bcdfghjklmnpqrstvxyzw';
        var vowels = 'aeiou';
        function createUserName() {
            var length = Math.floor(4*Math.random()) + 3;
            var name = '';
            while (name.length < length) {
                name += Math.random() > 0.5 ? consonants.charAt(rnd(consonants.length)) : '';
                name += vowels.charAt(rnd(vowels.length));
                name += consonants.charAt(rnd(consonants.length));
            }
            return name.charAt(0).toUpperCase() + name.slice(1, length);
        }
        function createItem(id, owner) {
            var type = ['pen', 'fork', 'spoon', 'knife', 'armor', 'mug', 'table', 'hat', 'shoe', 'sword', 'shield'];
            var size = ['epic', 'awesome', 'old', 'modern', 'unique', 'tiny', 'small', 'large', 'huge'];
            var color = ['red', 'green', 'blue', 'yellow', 'brown', 'purple', 'gray', 'white', 'black', 'cyan'];
            var material = ['wooden', 'iron', 'steel', 'plastic', 'textil', 'silk', 'leather'];
            return new Item(id, type[rnd(type.length)], size[rnd(size.length)], color[rnd(color.length)], material[rnd(material.length)], owner);
        }
        var repo = await Repository.create('./test-repo.json');
        repo.dataTypes.User.ctor = User;
        repo.dataTypes.Item.ctor = Item;
        test('Should create a repository', ctx => ctx.assert(repo, '!null'));
        test('Should have 4 data types and 2 entities', ctx => {
            ctx.assert(Object.keys(repo.dataTypes).length, '=', 4);
            ctx.assert(Object.keys(repo.data).length, '=', 2);
        });
        test('Should have 2 keys', ctx => ctx.assert(Object.values(repo.dataTypes).reduce((c,v) => v.key != undefined ? c+1 : c, 0), '=', 2));
        // test('Should have 1 link User->Item', ctx => ctx.assert(repo.dataTypes.User.links.items.entity, '=', repo.dataTypes.Item));
        // test('Should have 1 link Item->User', ctx => ctx.assert(repo.dataTypes.Item.links.ownerId.entity, '=', repo.dataTypes.User));
        test('Should have 4 indices', ctx => ctx.assert(Object.keys(repo.indices).length, '=', 4));
        test('Should have 2 queries', ctx => ctx.assert(Object.keys(repo.queries).length, '=', 2));

        test('Should add 1 User and set indices', ctx => {
            repo.add(new User(1, createUserName()));
            var ix = repo.indices.find(x => x.name == 'uid');
            ctx.assert(ix, '!null');
            ctx.assert(ix.count, '=', 1);
            ix = repo.indices.find(x => x.name == 'name');
            ctx.assert(ix, '!null');
            ctx.assert(ix.count, '=', 1);
        });
        test('Should add User and Item objects', ctx => {
            for (var i=2; i<1001; i++) {
                var name = null;
                while (true) {
                    name = createUserName();
                    if (repo.get('User', 'name', name) == null) break;
                }
                repo.add(new User(i, name));
            }
            var ix = repo.indices.find(x => x.name == 'uid');
            ctx.assert(ix, '!null');
            ctx.assert(ix.count, '=', 1000);
            ix = repo.indices.find(x => x.name == 'name');
            ctx.assert(ix, '!null');
            ctx.assert(ix.count, '=', 1000);
            for (var i=0; i<5000; i++) {
                var item = createItem(i, null);
                item.owner = rnd(repo.data.User.length);
                repo.add(item);
            }
            ix = repo.indices.find(x => x.name == 'iid');
            ctx.assert(ix, '!null');
            ctx.assert(ix.count, '=', 5000);
            var count = 0;
            ix = repo.indices.find(x => x.name == 'owner');
            var block = ix.data.first();
            do {
                count += block._data.length;
                block = ix.data.next();
            } while (block != null);
            ctx.assert(count, '=', 5000);
        });
        // test('Should return users and items', ctx => {
        //     var user = null;
        //     var id = 0;
        //     for (var ui=0; ui<10; ui++) {
        //         id += rnd(100);
        //         user = repo.get('User', 'id', id);
        //         ctx.assert(user, '!null');
        //         var items = repo.get('Item', 'ownerId', id);
        //         if (items) {
        //             message(`${user.name} has`, 1);
        //             for (var i=0; i<items.length; i++) {
        //                 message(items[i]);
        //             }
        //             TestConfig.indent--;
        //         } else {
        //             message(`${user.name} has nothing`);
        //         }
        //     }
        // });
        test('Should be sorted by indices', ctx => {
            for (var i in repo.indices) {
                if (repo.indices.hasOwnProperty(i)) {
                    var index = repo.indices[i];
                    message(index.name, 1);
                    var last = index.data.first();
                    ctx.assert(last, '!null');
                    if (from) {
                        message(`Iterate from '${from[index.attribute]}'`);
                        var from = index.data.next();
                        var error = 0;
                        index.data.range(from, null, item => {
                            if (index.data.compare.method(last, item) > 0) error++;
                            return error > 0;
                        }, null);
                    }
                    TestConfig.indent--;
                }
            }
        });
        test('Should query users by name', ctx => {
            var half = Math.floor(repo.data.User.length*0.5);
            var ix1 = Math.floor(half*Math.random());
            var ix2 = ix1 + half;
            var user1 = repo.dataTypes.User.indices.name.getAt(ix1);
            var user2 = repo.dataTypes.User.indices.name.getAt(ix2);
            var users = repo.query('GetUsersByName', {
                'name1': user1.name,
                'name2': user2.name,
            });
            var count = 0;
            for (var i=0; i<repo.data.User.length; i++) {
                var user = repo.data.User[i];
                if (user.name >= user1.name && user.name < user2.name) count++;
            }
            ctx.assert(users.length, '=', count);
        });
        // test('Should create a User entity', ctx => {
        //     var items = [
        //         repo.get('Item', 'iid', 1),
        //         repo.get('Item', 'iid', 2),
        //         createItem(10000, null)
        //     ];
        //     var user = repo.User.create({
        //         'uid': 10000,
        //         'name':'TestUser1',
        //         'items': items
        //     });
        //     ctx.assert(user, '!null');
        //     ctx.assert(user.items, ':=', [1,2]);
        //     ctx.assert(user, ':=', repo.get('User', 'uid', 10000));
        // });
        test('Should read a User entity', ctx => {
            var uid = 13;
            var expected = repo.get('User', 'uid', uid);
            var user = repo.User.read(uid);
            ctx.assert(user, '!null');
            ctx.assert(user.uid, '=', expected.uid);
            ctx.assert(user.name, '=', expected.name);
            for (var i=0; i<user.items.length; i++) {
                ctx.assert(user.items[i], '=', expected.items[i]);
            }            
        });
        test('Should update a User entity', ctx => {

        });
        test('Should delete a User entity', ctx => {

        });
    }

    var repo = null;

    function User(id, name) {
        this.uid = id;
        this.name = name;
        this.items = [];
    }
    function Item(id, type, size, color, material, owner) {
        this.iid = id;
        this.type = type;
        this.size = size;
        this.color = color;
        this.material = material;
        this.owner = owner;
    }

    async function setup() {
        repo = await Repository.create('./test/repo.json');
    }

    async function test_createRepository() {
        header('Test create repository');
        await setup();
    }    
    async function test_dataLoad() {
        header('Test data load');
        await setup();
    }
    async function test_dataStore() {
        header('Test data store');
        await setup();
    }
    async function test_readEntity() {
        header('Test read User entity');
        await setup();
    }
    async function test_createEntity() {
        header('Test create User entity');
        await setup();
    }
    async function test_updateEntity() {
        header('Test update User entity');
        await setup();
    }
    async function test_deleteEntity() {
        header('Test delete User entity');
        await setup();
    }
    var tests = () => [
        test_dataLoad,
        test_dataStore,
        test_readEntity,
        test_createEntity,
        test_updateEntity,
        test_deleteEntity,
        test_createRepository
    ];

    publish(tests, 'Repository tests');
})();