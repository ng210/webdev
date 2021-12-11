include('/lib/type/schema.js');

if (ISNODEAPP) {
    self.http = require('http');
}
(function() {
    //#region API BASE
    function configTransfer(mimeType, obj) {
        obj.mimeType = mimeType;
        var item = Api.mimeTypeMap[mimeType];
        if (item) {
            obj.responseType = item.responseType;
            obj.charSet = item.charSet;
        }
    }

    function Endpoint(id, api, def, handler) {
        this.id = id;
        this.api = api;
        this.resourceType = def.resource;
        this.method = Api.actionVerbMap[def.method] || def.method;
        this.access = def.access || (this.resourceType ? `${def.method.toLowerCase()}_${this.resourceType.name.toLowerCase()}` : null);
        this.request = def.request;
        configTransfer(this.request.mimeType, this.request);
        this.response = def.response;
        configTransfer(this.response.mimeType, this.response);
        this.call = handler;
        this.context = this;
    }

    Endpoint.prototype.call = async function call(args) {
        throw new Error('Not implemented!');
    };

    function Api(schemaInfo) {
        if (schemaInfo) {
            this.schema = schemaInfo.schema;
            this.definition = schemaInfo.definition;
            this.id = this.definition.id;
            this.url = new Url(this.definition.url);
            this.authorization = this.definition.authorization;
            if (!this.url.path.endsWith('/')) this.url.path += '/';
            // create endpoints
            this.endpoints = {};
            for (var i in this.definition.Endpoints) {
                var ep = this.definition.Endpoints[i];
                this.endpoints[i] = {};
                for (var j in ep.calls) {
                    var call = mergeObjects(ep.calls[j]);
                    //ep.methods.push(j);
                    call.method = j.toLowerCase();
                    var p = this.createEndpoint(i, call);
                    if (p) {
                        this.endpoints[i][call.method] = p;
                    }
                }
            }
            // create resource endpoints
            for (var i=0; i<this.definition.Resources.length; i++) {
                var res = this.definition.Resources[i];
                var resourceType = this.schema.types.get(res.type);
                // def.resource = resourceType;
                // var resId = res.id || resourceType.name.toLowerCase();
                // def.response.type = resourceType.name;
                for (var j=0; j<res.methods.length; j++) {
                    var method = res.methods[j].toLowerCase();
                    var callDef = {
                        "access": "",
                        "method": method,
                        "resource": resourceType,
                        "request": this.schema.types.get('HttpRequest').createDefaultValue(),
                        "response": this.schema.types.get('HttpResponse').createDefaultValue()
                    };
                    switch (method) {
                        case 'create':
                        case 'update':
                            callDef.request.arguments = [ { "name":"res", "type":resourceType.name } ];
                            break;
                        case 'read':
                        case 'delete':
                            callDef.request.arguments = [ { "name":"id", "type":`ref ${resourceType.name}` } ];
                            break;
                    }
                    var resId = resourceType.name.toLowerCase();
                    var p = this.createEndpoint(resId, callDef);
                    if (p) {
                        p.context = this;
                        if (this.endpoints[resId] == undefined) this.endpoints[resId] = {};
                        this.endpoints[resId][method] = p;
                    }
                }
            }
            //this.methods = Object.keys(methods);
            if (this.authorization) {
                // create login endpoint
                this.endpoints.login = {
                    post:  this.createEndpoint('login', {
                            "method": "post",
                            "request": {
                                "mimeType": "application/json",
                                "arguments": [
                                    { "name":"id", "type":"string" },
                                    { "name":"password", "type":"string" }
                                ]
                            },
                            "response": {
                                "mimeType": "application/json",
                                "type": "string"
                            }
                        })
                };
            }
        }
    }
    Api.prototype.createEndpoint = function createEndpoint(id, def) {
        throw new Error('Not implemented!');
    };
    Api.prototype.resourceAction = function resourceAction(id, type, method) {
        // get type
        if (typeof type === 'string') type = this.schema.types.get(type);
        // call endpoint
        var verb = Api.actionVerbMap[method.toLowerCase()] || method;
        var res = type.name.toLowerCase();
        var resp = id != null ? this.endpoints[res][verb].call(id) : this.endpoints[res][verb].call();
        return resp;
    };

    Api.prototype.create = function create(obj, type) {
        return this.resourceAction(obj, type, 'create');
    };
    Api.prototype.read = function read(id, type) {
        return this.resourceAction(id, type, 'read');
    };
    Api.prototype.update = function update(obj, type) {
        return this.resourceAction(obj, type, 'update');
    };
    Api.prototype.delete = function delete_(id, type) {
        return this.resourceAction(id, type, 'delete');
    };
    //#endregion

    //#region API CLIENT
    function ApiClient(schemaInfo) {
        this.rest = {};
        ApiClient.base.constructor.call(this, schemaInfo);
    }
    extend(Api, ApiClient);

    ApiClient.prototype.createEndpoint = function ApiClientCreateEndpoint(id, def) {
        var ep = new Endpoint(id, this, def, ApiClient.endpointCall);
        if (!this.rest[id]) this.rest[id] = {};
        this.rest[id][def.method] = async function() { return await ApiClient.endpointCall.apply(ep, arguments) };
        return ep;
    };
    ApiClient.prototype.addAuthorization = function addAuthorization(options) {
        if (this.authorization) {
            // get token from local store
            var token = localStorage.getItem(this.id + '-token');
            if (token) options.headers.authorization = 'Bearer ' + token;
        }
    };
    ApiClient.prototype.login = async function login(id, password) {
        var result = null;
        if (this.endpoints.login) {
            result = await this.endpoints.login.post.call(id, password)
            if (result.statusCode == 200) {
                localStorage.setItem(this.id + '-token', result.data);
                result = result.data;
            } else {
                var error = new Error('Login failed!');
                error.statusCode = result.statusCode;
                error.status = result.data;
                result = error;
            }
        }
        return result;
    };
    ApiClient.endpointCall = async function ApiClientEndpointCall() {
        var resp = { error:null, data:null, statusCode:200 };
        // validate args
        var argKeys = [];
        var argValues = [];
        var results = [];
        var options = {
            url: this.api.url + this.id,
            data: null,
            method: this.method,
            headers: {}
        };
        for (var i=0; i<arguments.length; i++) {
            var arg = arguments[i];
            var type = this.request.arguments[i].type;
debugger
            this.api.schema.types.get(type).validate(arg, results);
            argKeys.push(this.request.arguments[i].name);
            argValues.push(arg);
        }
        
        if (results.length == 0) {
            if (this.request.mimeType && this.request.mimeType != '*') options.contentType = this.request.mimeType;
            if (this.request.responseType) options.responseType = this.request.responseType;
            if (this.response.responseType) options.responseType = this.response.responseType;
            if (this.request.charSet) options.contentType += '; charset=' + this.request.charSet;
            if (this.method == 'get') {
                if (argKeys.length > 0) {
                    var query = [];
                    for (var i=0; i<argKeys.length; i++) {
                        // html_encode(args[i])
                        query.push(`${argKeys[i]}=${argValues[i]}`);
                    }
                    options.url += '?' + query.join('&');
                }
            } else {
                options.data = JSON.stringify(argValues);
            }

            this.api.addAuthorization(options);
            // start ajax call
            await ajax.send(options);
            resp.statusCode = options.statusCode;
            if (options.response != null) {
                resp.data = await ajax.processContent(options);
            }
            resp.error = options.error;
            if (resp.statusCode == 200) {
                // validate response
                var respType = this.response.type;
                var type = typeof respType === 'string' ? this.api.schema.types.get(respType) : this.api.schema.types.get(respType.name);
                var results = type.validate(resp.data);
                if (results.length > 0) {
                    resp.error = new Error('Invalid response received!');
                    resp.error.details = results;
                }
            }
        } else {
            resp.error = new Error('Validation errors');
            resp.error.details = results;
            //res = Promise.resolve(options)
        }
        return resp;
    };

    //#endregion

    //#region API SERVER
    /**************************************************************************
     * API Server
     * - run starts a HTTP listener
     * - incoming requests are routed to respective end-points
     * - end-points call the assigned handler
     **************************************************************************/
    function ApiServer(schemaInfo) {
        ApiServer.base.constructor.call(this, schemaInfo);
        if (this.definition) {
            this.fileUrl = new Url(this.url.path);
            // create Info endpoint
            var p = this.createEndpoint('', {
                "method": "get",
                "response": {
                    "mimeType": "application/json",
                    "type": "Service"
                }
            });
            if (p) {
                this.endpoints[''] = { get: p };
            }
        }
        this.tokens = [];
    }
    extend(Api, ApiServer);

    ApiServer.prototype.createToken = function createToken(userId) {
        var token = {
            id: Api.TOKEN_COUNTER++,
            uid: userId,
            expires: new Date().getTime() + (this.tokenExpiration || 3600000)
        };
        var ix = this.tokens.findIndex(x => x.uid == userId);
        if (ix != -1) {
            // replace token
            this.tokens[ix] = token;
        } else {
            // store token
            this.tokens.push(token);
        }
        return token;
    };

    ApiServer.prototype.createEndpoint = function ApiServerCreateEndpoint(id, def) {
        var handler = this[`${def.method}_${id}`];
        var ep = null;
        if (typeof handler === 'function') {
            ep = new Endpoint(id, this, def, handler);
        }
        return ep;
    };

    ApiServer.prototype.info = function info() {
        var sb = ['\n'];
        sb.push(`API: '${this.id}'`);
        //        0123456789 012345 01234567890123456789 
        sb.push('┌────────────┬────────┬──────────────────────┐');
        sb.push('│ ID         │ VERB   │ HANDLER              │');
        sb.push('╞════════════╪════════╪══════════════════════╡');
        for (var i in this.endpoints) {
            var group = this.endpoints[i];
            for (var j in group) {
                var ep = group[j];
                if (ep.call != null) {
                    var id = i != '' ? i : '[info]'; 
                    sb.push(`│ ${(id+'          ').slice(0, 10)} │ ${(j.toUpperCase()+'    ').slice(0, 6)} │ ${(ep.call.name+'                    ').slice(0, 20)} │`);
                    sb.push('╞════════════╪════════╪══════════════════════╡');
                }
            }
        }
        sb.pop();
        sb.push('└────────────┴────────┴──────────────────────┘');
        return sb.join('\n');
    };

    ApiServer.prototype.run = function run() {
        console.log('Run api-server on ' + this.url);
        var api = this;
        http.createServer((req, resp) => api.onrequest(req, resp)).listen(this.url.port);
    };

    ApiServer.prototype.onrequest = function onrequest(req, resp) {
        var reqBody = [];
        try {
            req
                .on('error', err => { console.error(err); })
                .on('data', chunk => { reqBody.push(chunk); })
                .on('end', () => this.processRequest(req, resp, reqBody));
        } catch (err) {
            // TODO: add customizable error handling
            // send 500
            resp.statusCode = 500;
            resp.send(err);
        }
    };
    
    ApiServer.prototype.processRequest = function processRequest(req, resp, reqBody) {
        var headers = {};
        reqBody = Buffer.concat(reqBody).toString();
        if (reqBody.length == 0) reqBody = null;
        debug_(`Request from ${req.headers.referer} to ${req.url} (${req.method}) received.`, 1);
        // route request to the handler
        resp.statusCode = 200;
        var reqUrl = new Url(req.url);
        var body = null;
        var method = req.method.toLowerCase();
        var ix = reqUrl.path.indexOf(this.fileUrl.path);
        if (ix != 0) {
            resp.statusCode = 404;
            body = 'Invalid path!';
        } else {
            var path = reqUrl.path.substr(this.fileUrl.path.length+1);
            var ep = this.endpoints[path];
            if (ep) {
                if (this.checkCORS(ep, req, resp)) {
                    var endpoint = ep[method];
                    if (method != 'options') {
                        if (endpoint && endpoint.call) {
                            var args = [];
                            var results = [];

                            //#region get call parameters from request
                            if (method == 'get') {
                                for (var i in reqUrl.query) {
                                    var arg = endpoint.request.arguments.find(x => x.name == i);
                                    if (!arg) {
                                        results.push(new Schema.ValidationResult(i, 'Invalid request argument!'));
                                    } else {
                                        args.push( this.schema.types.get(arg.type).isNumeric ? parseFloat(reqUrl.query[i]) : reqUrl.query[i]);
                                    }
                                }
                            } else {
                                if (reqBody) {
                                    switch (endpoint.request.mimeType) {
                                        case 'application/json':
                                            args = JSON.parse(reqBody);
                                            break;
                                    }
                                }
                            }
                            //#endregion
                            
                            //#region validate input
                            if (endpoint.request.arguments) {
                                for (var i=0; i<endpoint.request.arguments.length; i++) {
                                    var typeName = endpoint.request.arguments[i].type;
                                    if (typeof typeName === 'object') typeName = type.name;
                                    var type = this.schema.types.get(typeName);
                                    if (!type) {
                                        results.push(new Schema.ValidationResult(i, 'Request argument has unknown type!'));
                                    } else {
                                        type.validate(args[i], results);
                                    }
                                }
                            }
                            //#endregion

                            //#region make call
                            if (results.length != 0) {
                                resp.statusCode = 400;
                                body = JSON.stringify(results);
                            } else {
                                if (!this.authorization || this.authorize(endpoint, req, resp)) {
                                    args.push(req, resp);
                                    body = endpoint.call.apply(endpoint, args);
                                    console.info(`Request handled by ${endpoint.call.name}`);
                                    // validate output
                                    switch (endpoint.response.mimeType) {
                                        case 'application/json':
                                            try {
                                                if (body) {
                                                    body = JSON.stringify(body);
                                                }
                                            } catch (err) {
                                                debugger
                                            }
                                            break;
                                    }
                                }
                            }
                            //#endregion

                            // set endpoint-related headers here
                            resp.setHeader('Content-Type', endpoint.response.mimeType || 'plain/text');
                        } else {
                            resp.statusCode = 405;
                            body = 'Method not supported!'
                        }
                    }
                }
                // set Access-Control-Allow-Headers
                var headers = resp.getHeaderNames().select(x => !x.toLowerCase().startsWith('access-control-'));
                if (this.authorization) headers.push('authorization');
                // add general headers
                headers.push('content-type');
                resp.setHeader('Access-Control-Allow-Headers', headers);
            } else {
                resp.statusCode = 404;
                body = 'Path not defined!';
            }
        }
        if (resp.statusCode != 200 && !body) {
            var error = 'Unhandled error!';
            switch (resp.statusCode) {
                case 401: error = 'Unauthorized access!'; break;
                case 403: error = 'Access denied!'; break;
            }
            body = `{"error":"${error}"}`;
        }
        if (body != undefined) resp.write(body);
        resp.end();
        debug_(`Response with status ${resp.statusCode} sent.`, 1);
    };

    ApiServer.prototype.authorize = function authorize(endpoint, req, resp) {
        var identity = Api.ZERO_IDENTITY;
        var result = true;
        // has endpoint access control?
        if (endpoint.access) {
            var token = null;
            // get token from header
            if (req.headers.authorization) {
                var match = req.headers.authorization.match(/bearer\s(\w+)/i);
                if (match && match[1]) {
                    token = JSON.parse(atob(match[1]));
                    var now = new Date().getTime();
                    if (this.tokens.find(x => x.uid == token.uid && x.id == token.id && x.expires > now)) {
                        // token is valid
                        identity = token.uid;
                    }
                }
            }
            if (!token) {
                resp.statusCode = 403;
                result = false;
            } else {
                result = this.checkAccess(endpoint, identity, req, resp);
            }
        }
        return result
    };

    ApiServer.prototype.checkCORS = function checkCORS(endpoint, req, resp) {
        var res = true;
        // check content type
        // if (endpoint.request.mimeType == '*' || endpoint.request.mimeType == req.headers['Content-Type']) {
        //     resp.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        // } else res = false;

        // origin
        var origin = req.headers.origin || req.headers.referer;
        if (origin && (!endpoint.origin || endpoint.origin == '*' || endpoint.origin.includes(origin))) {
            resp.setHeader('Access-Control-Allow-Origin', origin);
        } else res = false;

        // methods
        resp.setHeader('Access-Control-Allow-Methods', this.methods);
        return res;
    };

    ApiServer.prototype.checkAccess = function checkAccess(endpoint, id, req, resp) {
        return true;
    };

    ApiServer.prototype.post_login = function post_login(id, passw, req, resp) {
        var result = null;
        if (typeof this.api.login === 'function') {
            result = this.api.login(id, passw);
        }
        if (!result) {
            resp.statusCode = 401;
            //result = 'Authentication failed!';
        } else {
            result.remote = req.socket.remoteAddress;
            result = btoa(JSON.stringify(result));
        }
        return result;
    };

    ApiServer.prototype.get_ = function get_() {
        // var definition = {};
        // var dataTypes = {};
        // for (var i in this.api.schema.imports) {
        //     for (var j=0; j<this.api.schema.imports[i].length; j++) {
        //         var type = this.api.schema.imports[i][j];
        //         dataTypes[type.name] = type;
        //     }
        // }            
        // for (var i in this.api.definition) {
        //     definition[i] = i != 'DataTypes' ? this.api.definition[i] : Object.values(dataTypes);
        // }
        // return definition;
        return this.api.definition;
    };
    //#endregion

    //#region API CREATE
    Api.mimeTypeMap = null;
    Api.actionVerbMap = {
        'create': 'post',
        'read': 'get',
        'update': 'put',
        'delete': 'delete'
    };
    Api.verbActionMap = (function() {
        var map = {};
        for (var i in Api.actionVerbMap) {
            map[Api.actionVerbMap[i]] = i;
        }
    })();
    Api.schemaInfo = {
        definition: null,
        schema: '/lib/service/service-schema.json',
        validate: 'Service'
    };

    Api.initialize = async function initialize() {
        if (Api.mimeTypeMap == null) {
            Api.mimeTypeMap = {};
            for (var i in ajax.ExtToMimeTypeResponseTypeMap) {
                var item = ajax.ExtToMimeTypeResponseTypeMap[i];
                if (item.mimeType) {
                    Api.mimeTypeMap[item.mimeType] = { responseType: item.responseType, charSet: item.charSet };
                }
            }
        }
    };

    Api.Server = async function Server(ApiType, apiDefinition) {
        var errors = [];
        // initialize API and schema
        var api = null;
        await Api.initialize();
        var schemaInfo = mergeObjects(Api.schemaInfo);
        schemaInfo.schema = await Schema.load(Api.schemaInfo.schema);
        var res = await load(apiDefinition);
        if (!res.errors) {
            // // create ApiServer instance
            // for (var i=0; i<schemaInfo.definition.DataTypes.length; i++) {
            //     schemaInfo.schema.buildType(schemaInfo.definition.DataTypes[i]);
            // }
            schemaInfo.definition = res.data;
            if (schemaInfo.definition.imports) {
                await schemaInfo.schema.importTypes(schemaInfo.definition.imports);
            }
            var results = schemaInfo.schema.validate(res.data, schemaInfo.validate);
            if (results.length == 0) {
                api = Reflect.construct(ApiType, [schemaInfo]);
                if (typeof api.initialize === 'function') {
                    await api.initialize();
                }
            } else {
                console.log(results.join('\n'));
            }
        } else {
            throw new Error(errors.join('\n'));
        }
        return api;
    };
    
    Api.Client = async function Client(apiDefinition) {
        var api = null;
        // initialize API
        await Api.initialize();
        var schemaInfo = mergeObjects(Api.schemaInfo);
        schemaInfo.schema = await Schema.load(Api.schemaInfo.schema);
        var res = await load({ 'url':apiDefinition, 'responseType':'json'});
        if (!res.error) {
            schemaInfo.definition = res.data;
            if (schemaInfo.definition.imports) {
                await schemaInfo.schema.importTypes(schemaInfo.definition.imports);
            }
            var results = schemaInfo.schema.validate(res.data, schemaInfo.validate);
            if (results.length == 0) {
                api = new ApiClient(schemaInfo);
            } else {
                console.log(results.join('\n'));
            }
        } else {
            console.log(res.error);
        }
        return api;
    };

    Api.ZERO_IDENTITY = 0;
    Api.TOKEN_COUNTER = 1;
    //#endregion

    publish(Api, 'Api');
    //publish(Endpoint, 'Endpoint', Api);
    publish(ApiServer, 'ApiServer');
    publish(ApiClient, 'ApiClient');
})();
