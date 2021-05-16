require('service/nodejs.js');
include('./api/store-api.js');

async function main(args, errors) {
    if (errors.length > 0) {
        for (var i=0; i<errors.length; i++) {
            console.log('Error: ' + errors[i].message);
        }
        return 0;
    }

    try {
        var api = await StoreApi.create('./schema/store-service.json')
        console.log(api.info());
        api.run();
    } catch (err) {
        console.log(err.message);
        if (err.details) console.log(err.details);
    }
}

run(main);