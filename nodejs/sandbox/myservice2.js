(function() {
    var ns_myservice2 = {

        startCreate: function(req, resp) {
            var chunks = [];
            req.on('data', (chunk) => {
                chunks.push(chunk);
            });
            req.on('end', () => {
                // Get data from request
                var body = chunks.join('');
                log('Data: ' + body);
                var json = JSON.parse(body);
                // Create new "session"
                create(json, resp);
            });
        },
        create: function(json, resp) {
            log('Create');
            // Simulate requesting a new session
            setTimeout( function(data) {
                /* Server code --------------------*/
                // Create a new session
                var session = {
                    id: randSeed++,
                    state: 'user',
                    error: []
                };
                sessions[session.id] = session;
                data.sid = session.id;
                /*--------------------------------*/
                //workflow('user', data, resp);
                addUser(json, resp);
            }, 1000, json);
        },
        addUser: function(json, resp) {
            log('User');
            // Simulate adding a new user
            setTimeout( function(data) {
                /* Server code --------------------*/
                var session = sessions[data.sid];
                if (session) {
                    var user = {
                        id: randSeed++,
                        name: data.name,
                        items: []
                    };
                    session.user = user;
                    users.push(user);
                    //workflow('items', data, resp);
                    addItems(data, resp);
                } else {
                    session.error.push('Illegal session!');
                    resp.end('{status:500, message:"Illegal session"}');
                }
            }, 1000, json);
        },
        addItems: function(json, resp) {
            log('Items');
            // Simulate adding items
            setTimeout( function(data) {
                /* Server code --------------------*/
                var session = sessions[data.sid];
                if (session && data.items) {
                    for (var i=0; i<data.items.length; i++) {
                        var item = {
                            id: randSeed++,
                            name: data.items[i],
                            uid: session.user.id
                        };
                        var res = addItem(item);
                        if (res !== null) {
                            session.error.push('Item creation failed!');
                            log('Item creation failed!');
                        }
                    }
                    ready(data, resp);
                } else {
                    log('Illegal session!');
                    session.error.push('Illegal session!');
                    resp.end('{status:500, message:"Illegal session"}');
                }
            }, 1000, json);
        },
        addItem: function(item) {
            log('Item');
            items.push(item);
            return null;
        },
        ready: function(data, resp) {
            log('Ready');
            var session = sessions[data.sid];
            if (session.error.length == 0) {
                resp.end(JSON.stringify(
                    {
                        status: 'ok',
                        uid: session.user.id
                    }
                ));
            } else {
                resp.end(JSON.stringify(
                    {
                        status: 'error',
                        error: session.error
                    }
                ));
            }
        }
    };

    module.exports = ns_myservice2;
}
)();