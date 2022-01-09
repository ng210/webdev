console.log('NODE_PATH='+process.env.NODE_PATH)
console.log('jslib='+process.env.jslib)

require('nodejs/nodejs.js');
include('/lib/type/schema.js');

function processArguments() {
    var args = {};
    if (process.argv.length > 2) {
        args.schema = process.argv[2];
    }
    if (process.argv.length > 4) {
        args.input = process.argv[3];
        args.type = process.argv[4];
    }
    return args;
}

function checkError(res) {
    if (res.error) {
        console.log(res.error.message);
    }
    return res.error;
}

async function main() {
    console.log('\n\n * Schema validation\n');
    var args = processArguments();

    if (args.schema) {
        try {
            if (args.input) {
                appUrl = new Url(args.input);
                var ix = appUrl.path.lastIndexOf('/');
                if (ix == -1) ix = appUrl.path.lastIndexOf('\\');
                ix++;
                var inputName = appUrl.path.substring(ix);
                appUrl.path = appUrl.path.slice(0, ix);
                // validate type of definition against schema
                var schema = await Schema.load(args.schema);
                if (!schema) throw new Error(`Could not load '${args.schema}'!`);
                var type = arts.type || schema.types.getAt(0);
                var res = await load(args.input);
                if (res.error) throw res.error;
                console.log(`Validate '${type}' from '${inputName}' against schema`);
                var errors = schema.validate(res.data, type);
                if (errors.length == 0) {
                    console.log('* Validation successful!');
                } else {
                    for (var i=0; i<errors.length; i++) {
                        console.log(errors[i]);
                    }
                }
                // print types
                console.log('Simple Types');
                schema.types.iterate( (k,v) => { if (!(v.basicType instanceof ObjectType)) console.log(`- ${k}`); });
                console.log('Complex Types');
                schema.types.iterate( (k,v) => { if (v.basicType instanceof ObjectType) console.log(`- ${k}`); });
            } else {
                // validate schema

            }
        } catch (err) {
            console.error(err);
        }
    } else {
        // print usage info
        console.log(
            `Usage
             schema.js <schema-definition>.json [input.json] [type]
             The <schema-definition> is a JSON file containing the types of the schema.
             The [input.json] is a JSON file containing a JSON object to be validated against the schema.
             If the schema contains more than 1 type at the top level the [type] selects the type for the validation, otherwise the first type is used.
             Example
             #1 node schema.js my-schema1.json my-input.json myType (myType from the schema is used).
             #2 node schema.js my-schema2.json my-input.json (first type in the schema is used).`
        );
    }
}

run(main);