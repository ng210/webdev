const fs = require('fs');

console.log('NODE_PATH='+process.env.NODE_PATH)
console.log('jslib='+process.env.jslib)

require('nodejs/nodejs.js');
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