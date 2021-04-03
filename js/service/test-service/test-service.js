const fs = require('fs');
require('service/nodejs.js');
include('./test-api.js');

async function main(args, errors) {
    if (errors.length > 0) {
        for (var i=0; i<errors.length; i++) {
            console.log('Error: ' + errors[i].message);
        }
        return 0;
    }

    try {
        var api = await Api.Server(TestApi, './test-service-definition.json');
        console.log(api.info());

        api.run();
    } catch (err) {
        console.log(err);
    }
}

run(main);