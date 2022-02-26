include('/lib/type/schema.js');

if (ISNODEAPP) {
    self.http = require('http');
}
(function() {
    //#region API BASE
    function Endpoint(api, def) {
        this.id = def.id;
        this.api = api;
        this.origin = def.origin || '';
        this.methods = [];
        this.calls = {};
        for (var i in def.calls) {
            this.methods.push(i.toUpperCase());
            var method = i.toLowerCase();
            this.calls[method] = api.createApiCall(this, def.calls[i], method);
        }
    }
    Endpoint.prototype.addCall = function addCall(method, call) {
        var m = method.toLowerCase();
        this[m] = this.calls[m] = call;
        this.methods.push(method.toUpperCase());
    };

    function ApiCall(endpoint, def, method, handler) {
        method = method.toLowerCase();
        this.parent = endpoint;
        this.resourceType = def.resource;
        this.method = Api.actionVerbMap[method] || method;
        this.access = def.access || (this.resourceType ? `${method.toLowerCase()}_${this.resourceType.name.toLowerCase()}` : null);
        this.request = this.parent.api.createRequest();
        if (def.request && def.request.arguments) {
            for (var i=0; i<def.request.arguments.length; i++) {
                this.request.arguments[i] = clone(def.request.arguments[i]);
                var argType = this.parent.api.schema.getOrBuildType(def.request.arguments[i].type);
                this.request.arguments[i].type = argType;
            }
        }
        this.response = this.parent.api.createResponse(def.response);
        if (def.response) {
            this.response.type = this.parent.api.schema.getOrBuildType(def.response.type);
        }
        this.parent[method] = this;
        this.do = handler;
        //this.context = this;
    }

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
            for (var i in this.definition.endpoints) {
                this.endpoints[i] = new Endpoint(this, this.definition.endpoints[i]);
            }
            // create resource endpoints
            for (var i=0; i<this.definition.resources.length; i++) {
                var res = this.definition.resources[i];
                var resourceType = this.schema.types.get(res.type);
                var resId = resourceType.name.toLowerCase();
                if (!this.endpoints[resId]) this.endpoints[resId] = new Endpoint(this, { 'id':resId });
                var ep = this.endpoints[resId];
                for (var j=0; j<res.methods.length; j++) {
                    var method = res.methods[j].toLowerCase();
                    var callDef = {
                        "access": "",
                        "resource": resourceType,
                        "request": this.schema.types.get('HttpRequest').createDefaultValue(),
                        "response": this.schema.types.get('HttpResponse').createDefaultValue()
                    };
                    switch (method) {
                        case 'create':
                        case 'update':
                            callDef.request.arguments = [ { "name":"res", "type":resourceType.name } ];
                            callDef.response.type = `ref ${resourceType.name}`;
                            break;
                        case 'read':
                        case 'delete':
                            callDef.request.arguments = [ { "name":"id", "type":`ref ${resourceType.name}` } ];
                            callDef.response.type = resourceType;
                            break;
                    }

                    var call = this.createApiCall(ep, callDef, method);
                    ep.addCall(call.method.toUpperCase(), call);
                }
            }
            //this.methods = Object.keys(methods);
            if (this.authorization) {
                // create login endpoint
                this.endpoints.login = new Endpoint(this, { 'id':'login' });
                this.endpoints.login.calls.post = this.createApiCall(
                    this.endpoints.login, {
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
                    }, 'post');
            }
        }
    }
    Api.prototype.createApiCall = function createApiCall(endpoint, def, method) {
        throw new Error('Not implemented!');
    };
    Api.prototype.createRequest = function createRequest() {
        var req = this.schema.types.get('HttpRequest').createDefaultValue();
        req.mimeType = req.mimeType.valueOf();
        var item = Api.mimeTypeMap[req.mimeType];
        if (item) {
            req.responseType = item.responseType;
            req.charSet = item.charSet;
        }
        return req;
    };
    Api.prototype.createResponse = function createResponse() {
        var resp = this.schema.types.get('HttpResponse').createDefaultValue();
        resp.mimeType = resp.mimeType.valueOf();
        var item = Api.mimeTypeMap[resp.mimeType];
        if (item) {
            resp.responseType = item.responseType;
            resp.charSet = item.charSet;
        }
        return resp;
    };

    Api.prototype.resourceAction = function resourceAction(id, type, method) {
        // get type
        if (typeof type === 'string') type = this.schema.types.get(type);
        // call endpoint
        var verb = Api.actionVerbMap[method.toLowerCase()] || method;
        var res = type.name.toLowerCase();
        var resp = id != null ? this.endpoints[res][verb].do(id) : this.endpoints[res][verb].do();
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

    ApiClient.prototype.createApiCall = function ApiClientCreateApiCall(endpoint, def, method) {
        var call = new ApiCall(endpoint, def, method, ApiClient.apiCall);
        var id = endpoint.id;
        if (!this.rest[id]) this.rest[id] = {};
        this.rest[id][method] = async function() { return await ApiClient.apiCall.apply(call, arguments) };
        return call;
    };
    ApiClient.prototype.addAuthorization = function addAuthorization(options) {
        if (this.authorization != 'None') {
            // get token from local store
            var token = localStorage.getItem(this.id + '-token');
            if (token) options.headers.authorization = 'Bearer ' + token;
        }
    };
    ApiClient.prototype.login = async function login(id, password) {
        var result = null;
        if (this.endpoints.login) {
            result = await this.endpoints.login.post.do(id, password)
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
    ApiClient.apiCall = async function ApiClientApiCall() {
        var resp = { error:null, data:null, statusCode:200 };
        // validate args
        var argKeys = [];
        var argValues = [];
        var results = [];
        var options = {
            url: this.parent.api.url + this.parent.id,
            data: null,
            method: this.method,
            headers: {}
        };
        // validation
        for (var i=0; i<arguments.length; i++) {
            var arg = arguments[i];
            this.request.arguments[i].type.validate(arg, results);
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
            this.parent.api.addAuthorization(options);
            // start ajax call
            await ajax.send(options);
            resp.statusCode = options.statusCode;
            if (options.response != null) {
                resp.data = await ajax.processContent(options);
            }
            resp.error = options.error;
            if (resp.statusCode == 200) {
                // validate response
                var results = [];
                this.response.type.validate(resp.data, results, ['response']);
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
            var ep = new Endpoint(this, {
                "id":"",
                "calls": {
                    "GET": {
                        "response": {
                            "mimeType": "application/json",
                            "type": "Service"
                        }
                    }
                }});
            this.endpoints[''] = ep;
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

    ApiServer.prototype.createApiCall = function ApiServerCreateApiCall(endpoint, def, method) {
        var handlerName = `${method}_${endpoint.id}`;
        var handler = this[handlerName];
        var call = null;
        if (typeof handler === 'function') {
            call = new ApiCall(endpoint, def, method, handler);
        } else {
            throw new Error(`Handler '${handlerName} not found!`);
        }
        return call;
    };

    ApiServer.prototype.info = function info() {
        var sb = ['\n'];
        sb.push(`API: '${this.id}'`);
        //        0123456789 012345 01234567890123456789
        sb.push('┌────────────┬────────┬──────────────────────┐');
        sb.push('│ ID         │ VERB   │ HANDLER              │');
        sb.push('╞════════════╪════════╪══════════════════════╡');
        for (var i in this.endpoints) {
            var ep = this.endpoints[i];
            for (var j in ep.calls) {
                var call = ep[j];
                if (call.do != null) {
                    var id = i != '' ? i : '[info]';
                    sb.push(`│ ${(id+'          ').slice(0, 10)} │ ${(j.toUpperCase()+'    ').slice(0, 6)} │ ${(call.do.name+'                    ').slice(0, 20)} │`);
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
                var call = ep[method];
                if (this.checkCORS(ep, req, resp)) {
                    if (method != 'options') {
                        if (call && call.do) {
                            var args = [];
                            var results = [];

                            //#region get call parameters from request
                            if (method == 'get') {
                                for (var i in reqUrl.query) {
                                    var arg = call.request.arguments.find(x => x.name == i);
                                    if (!arg) {
                                        results.push(new Schema.ValidationResult(i, 'Invalid request argument!'));
                                    } else {
                                        args.push( arg.type.isNumeric ? parseFloat(reqUrl.query[i]) : reqUrl.query[i]);
                                    }
                                }
                            } else {
                                if (reqBody) {
                                    switch (call.request.mimeType) {
                                        case 'application/json':
                                            args = JSON.parse(reqBody);
                                            break;
                                    }
                                }
                            }
                            //#endregion

                            //#region validate input
                            if (call.request.arguments) {
                                for (var i=0; i<call.request.arguments.length; i++) {
                                    var type = call.request.arguments[i].type;
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
                                if (this.authorization == 'None' || this.authorize(call, req, resp)) {
                                    args.push(req, resp);
                                    body = call.do.apply(call, args);
                                    console.info(`Request handled by ${call.do.name}`);
                                    // validate output
                                    switch (call.response.mimeType) {
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
                            resp.setHeader('Content-Type', call.response.mimeType || 'plain/text');
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
        var method = req.headers['access-control-request-method'];
        if (method && endpoint.methods.includes(method.toUpperCase())) {
            resp.setHeader('Access-Control-Allow-Methods', method);
        }
        return res;
    };

    ApiServer.prototype.checkAccess = function checkAccess(endpoint, id, req, resp) {
        return true;
    };

    ApiServer.prototype.post_login = function post_login(id, passw, req, resp) {
        var result = null;
        if (typeof this.parent.api.login === 'function') {
            result = this.parent.api.login(id, passw, req.socket.remoteAddress);
        }
        if (!result) {
            resp.statusCode = 401;
            //result = 'Authentication failed!';
        } else {
            result = btoa(JSON.stringify(result));
        }
        return result;
    };

    ApiServer.prototype.get_ = function get_() {
        return this.parent.api.definition;
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
    publish(ApiServer, 'ApiServer');
    publish(ApiClient, 'ApiClient');
})();
