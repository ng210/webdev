include('/lib/utils/schema.js');
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
        this.method = Api.actionVerbMap[def.method] || def.method;
        this.request = mergeObjects(def.request);
        configTransfer(this.request.mimeType, this.request);
        this.response = mergeObjects(def.response);
        configTransfer(this.response.mimeType, this.response);
        this.call = handler;
    }

    Endpoint.prototype.call = async function call(args) {
        throw new Error('Not implemented!');
    };

    function Api(definition) {
        this.methods = [];
        if (definition) {
            var methods = {};
            this.id = definition.id;
            this.url = new Url(definition.url);
            if (!this.url.path.endsWith('/')) this.url.path += '/';
            this.definition = definition;
            // create endpoints
            this.endpoints = {};
            for (var i=0; i<this.definition.Endpoints.length; i++) {
                var ep = this.definition.Endpoints[i];
                this.endpoints[ep.id] = {};
                for (var j=0; j<ep.calls.length; j++) {
                    var call = mergeObjects(ep.calls[j]);
                    methods[call.method] = true;
                    call.method = call.method.toLowerCase();
                    var p = this.createEndpoint(ep.id, call);
                    if (p) {
                        this.endpoints[ep.id][call.method] = p;
                    }
                }
            }
            // create resources
            var def = {
                "method": '',
                "request": {
                    "mimeType": "application/json",
                    "arguments": null
                },
                "response": {
                    "mimeType": "application/json",
                    "type": null
                }
            };
            for (var i=0; i<this.definition.Resources.length; i++) {
                var res = this.definition.Resources[i];
                var resourceType = Api.schema.types[res.type];
                def.response.type = resourceType.name;
                for (var j=0; j<res.methods.length; j++) {
                    var method = res.methods[j].toLowerCase();
                    var verb = Api.actionVerbMap[method] || method;
                    methods[verb.toUpperCase()] = true;
                    def.method = method;
                    switch (method) {
                        case 'create':
                        case 'update':
                            def.request.arguments = [ { "name":"res", "type":resourceType.name } ];
                            break;
                        case 'retrieve':
                        case 'delete':
                            def.request.arguments = [ { "name":res.key, "type":resourceType.attributes[res.key].type.name } ];
                            break;
                    }
                    var p = this.createEndpoint(res.id, def);
                    if (p) {
                        if (this.endpoints[res.id] == undefined) this.endpoints[res.id] = {};
                        this.endpoints[res.id][verb] = p;
                    }
                }
            }
            this.methods = Object.keys(methods);
        }
    }
    Api.prototype.createEndpoint = function createEndpoint(id, def) {
        throw new Error('Not implemented!');
    };
    Api.prototype.resourceAction = function resourceAction(arg, type, method) {
        // get type
        // validate
        // call endpoint
        // validate response

        this.type = Api.schema.types[type];
        this.data = null;
        this.methods = [];
        for (var i=0; i<def.methods.length; i++) {
            this.methods.push(def.methods[i].toLowerCase());
        }
    };

    Api.prototype.create = function create(obj, type) {
        return this.resourceAction(obj, type, 'create');
    };
    Api.prototype.retrieve = function retrieve(id, type) {
        return this.resourceAction(id, type, 'retrieve');
    };
    Api.prototype.update = function update(obj, type) {
        return this.resourceAction(obj, type, 'update');
    };
    Api.prototype.delete = function delete_(id, type) {
        return this.resourceAction(id, type, 'delete');
    };
    //#endregion

    //#region API CLIENT
    function ApiClient(definition) {
        ApiClient.base.constructor.call(this, definition);
    }
    extend(Api, ApiClient);

    ApiClient.prototype.createEndpoint = function ApiClientCreateEndpoint(id, def) {
        var ep = new Endpoint(id, this, def, ApiClient.endpointCall);
        return ep;
    };
    ApiClient.endpointCall = async function ApiClientEndpointCall() {
        var res = null;
        // validate args
        var argKeys = [];
        var argValues = [];
        var results = [];
        for (var i=0; i<arguments.length; i++) {
            var arg = arguments[i];
            var type = this.request.arguments[i].type;
            Api.schema.types[type].validate(arg, results);
            argKeys.push(this.request.arguments[i].name);
            argValues.push(arg);
        }
        
        if (results.length == 0) {
            var options = {
                url: this.api.url + this.id,
                data: null,
                method: this.method
            };
            if (this.request.mimeType && this.request.mimeType != '*') options.contentType = this.request.mimeType;
            if (this.request.responseType) options.responseType = this.request.responseType;
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
            // start ajax call
            await ajax.send(options);
            
            if (options.error) res = options.error;
            var res = await ajax.processContent(options);
            // validate response
            var respType = this.response.type;
            var type = typeof respType === 'string' ? Api.schema.types[respType] : Api.schema.types[respType.name];
            var results = type.validate(res);
            if (results.length > 0) {
                res = new Error('Invalid response received!');
                res.details = results;
            }
        } else {
            options.error = new Error('Validation errors');
            options.error.details = errors;
            res = Promise.resolve(options)
        }
        return res;
    };

    //#endregion

    //#region API SERVER
    /**************************************************************************
     * API Server
     * - run starts a HTTP listener
     * - incoming requests are routed to respective end-points
     * - end-points call the assigned handler
     **************************************************************************/
    function ApiServer(definition) {
        ApiServer.base.constructor.call(this, definition);
        if (definition) {
            this.fileUrl = new Url(this.url.path);
            var p = this.createEndpoint('', {
                "method": "get",
                "request": {
                    "mimeType": "*",
                    "arguments": []
                },
                "response": {
                    "mimeType": "application/json",
                    "type": "Service"
                }
            });
            if (p) {
                this.endpoints[''] = { get: p };
            }
        }
    }
    extend(Api, ApiServer);

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
        req
            .on('error', err => { console.error(err); })
            .on('data', chunk => { reqBody.push(chunk); })
            .on('end', () => this.processRequest(req, resp, reqBody));
    };
    
    ApiServer.prototype.processRequest = function processRequest(req, resp, reqBody) {
        reqBody = Buffer.concat(reqBody).toString();
        if (reqBody.length == 0) reqBody = null;
        debug_(`Request from ${req.headers.referer} to ${req.url} (${req.method}) received.`, 1);
        // route request to the handler
        resp.statusCode = 200;
        var reqUrl = new Url(req.url);
        var ix = reqUrl.path.indexOf(this.fileUrl.path);
        var body = null;
        var method = req.method.toLowerCase();
        //var contentType = 'application/json';
        if (ix != 0) {
            resp.statusCode = 404;
            body = 'Invalid path!';
        } else {
            var path = reqUrl.path.substr(this.fileUrl.path.length+1);
            var ep = this.endpoints[path];
            if (ep) {
                var endpoint = ep[method];
                if (this.checkCORS(ep, req, resp)) {
                    if (method != 'options') {
                        if (endpoint && endpoint.call) {
                            var args = [];
                            var results = [];
                            if (method == 'get') {
                                for (var i in reqUrl.query) {
                                    var arg = endpoint.request.arguments.find(x => x.name == i);
                                    if (!arg) {
                                        results.push(new Schema.ValidationResult(i, 'Invalid request argument!'));
                                    } else {
                                        args.push( Api.schema.types[arg.type].isNumeric ? parseFloat(reqUrl.query[i]) : reqUrl.query[i]);
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
                            // validate input
                            for (var i=0; i<endpoint.request.arguments.length; i++) {
                                var typeName = endpoint.request.arguments[i].type;
                                if (typeof typeName === 'object') typeName = type.name;
                                var type = Api.schema.types[typeName];
                                if (!type) {
                                    results.push(new Schema.ValidationResult(i, 'Request argument has unknown type!'));
                                } else {
                                    type.validate(args[i], results);
                                }
                            }

                            if (results.length != 0) {
                                resp.statusCode = 400;
                                body = JSON.stringify(results);
                            } else {
                                args.push(req, resp);
                                body = endpoint.call.apply(endpoint, args);
                                console.info(`Request handled by ${endpoint.call.name}`);

                                // validate output
                                switch (endpoint.response.mimeType) {
                                    case 'application/json':
                                        body = JSON.stringify(body);
                                        break;
                                }
                                resp.setHeader('Content-Type', endpoint.response.mimeType);
                            }
                        } else {
                            resp.statusCode = 405;
                            body = 'Method not supported!'
                        }
                    }
                }
                resp.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            } else {
                resp.statusCode = 404;
                body = 'Path not defined!';
            }
        }
        if (body != undefined) resp.write(body);
        resp.end();
        debug_(`Response with status ${resp.statusCode} sent.`, 1);
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

    ApiServer.prototype.get_ = function get_() {
        return this.api.definition;
    };
    //#endregion

    //#region API CREATE
    Api.schemaDefinition = '/lib/service/service-schema.json';
    Api.schema = null;
    Api.mimeTypeMap = null;
    Api.actionVerbMap = {
        'create': 'post',
        'retrieve': 'get',
        'update': 'put',
        'delete': 'delete'
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
        if (Api.schema == null) {
            var res = await load(Api.schemaDefinition);
            if (res.error) throw res.error;
            Api.schema = new Schema(res.data);
        }
    };
    Api.validate = async function validate(definition, errors) {
        if (typeof definition === 'string') {
            var res = await load({ url:definition, responseType:'json', charSet:'utf-8' });
            if (res.error) {
                errors.push(res.error);
            } else {
                definition = res.data;
                Api.schema.types.Service.validate(definition, errors);
            }
        }
        return definition;
    };

    Api.Server = async function Server(ApiType, definition) {
        // initialize API
        await Api.initialize();
        // fetch definition
        var errors = [];
        var def = await Api.validate(definition, errors);
        if (errors.length > 0) {
            console.log(errors.join('\n'));
        }
        // create ApiServer instance
        return Reflect.construct(ApiType, [def]);
    };
    
    Api.Client = async function Client(definition) {
        var api = null;
        // initialize API
        await Api.initialize();
        // fetch definition
        var errors = [];
        var def = await Api.validate(definition, errors);
        if (errors.length > 0) {
            throw new Error(errors.map(x => x instanceof Error ? x.message : x.toString()));
        } else {
            // create ApiServer instance
            api = new ApiClient(def);
        }
        return api;
    };
    //#endregion

    publish(Api, 'Api');
    //publish(Endpoint, 'Endpoint', Api);
    publish(ApiServer, 'ApiServer');
    publish(ApiClient, 'ApiClient');
})();
