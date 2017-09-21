(function() {
    var ns_myservice1 = {

        states: {
            'claim': {
                'url': '/claims',
                'handler': 'claimHandler',
                'transform': 'createClaim',
                'validate': 'createClaim',
                'next': 'claimDetail'
             },
            'claimDetail': {
                'url': '/claims/{claimId}/claimdetail',
                'handler': 'claimDetailHandler',
                'next': 'partyContainer'
            },
            'partyContainer': {
                'url': '/claims/{claimId}/partyContainers',
                'handler': 'partyContainerHandler',
                'next': null
            }
        },

        Service: function(url, transformer, validator) {
            this.baseUrl = url;
            this.state = null;
            this.req = null;
            this.resp = null;
            this.transformer = transformer;
            this.validator = validator;
            this.claimId = '';

            this.request = function(req, resp) {
                try {
                    // Parse data from request
                    this.data = JSON.parse(req.body);
                    // Store response object
                    this.resp = resp;
                    // Set initial state
                    this.state = 'claim';
                    // Execute transition
                    this.next();
                } catch (ex) {
                    console.log(`Error: ${ex}`);
                }
            };
            this.next = function() {
                console.log(this.state);
                // Fetch state object
                var state = ns_myservice1.states[this.state];
                if (state) {
                    // Transform input data
                    var transformer = this.transformer[state.transform];
                    if (typeof transformer === 'function') {
                        var data = transformer(this.data);
                        // Validate transformed data
                        var validator = this.validator[state.validate];
                        if (typeof validator === 'function') {
                            var res = validator(data);
                            if (!res) {
                                // Call service
                                var url = this.baseUrl + state.url.replace('{claimId}', this.claimId);
                                doRequest(url, data, this).then(
                                    (obj) => {
                                        console.log(`${obj.that.state} response`);
                                        // Process response
                                        var respObj = JSON.parse(resp);
                                        if (obj.that.state.handler.call(obj.that, resp)) {
                                            // Call next step
                                            obj.that.next();
                                        } else {
                                            console.log('Response processing failed!');
                                        }
                                    }, (obj) => {
                                        console.log('Error during request!' + obj.error);
                                    }
                                );
                            } else {
                                console.log(`Validation failed: ${res}`);
                            }
                        } else {
                            console.log('Could not validate input!');
                        }
                    } else {
                        console.log('Could not transform input!');
                    }
                } else {
                    console.log(`Invalid state: ${this.state}`);
                }
            };
        }
    };

    module.exports = ns_myservice1;
}
)();