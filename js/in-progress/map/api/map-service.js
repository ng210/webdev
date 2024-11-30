const fs = require('fs');

console.log('NODE_PATH='+process.env.NODE_PATH)
console.log('jslib='+process.env.jslib)

require('nodejs/nodejs.js');
include('./map-api.js');

async function main(args, errors) {
    if (errors.length > 0) {
        for (var i=0; i<errors.length; i++) {
            console.log('Error: ' + errors[i]);
        }
        return 0;
    }

    try {
        var api = await Api.Server(MapApi, './map-service-definition.json');
        console.log(api.info());

        api.run();
    } catch (err) {
        console.log(err);
    }
}

run(main);