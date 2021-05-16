require('service/nodejs.js');
include('/lib/utils/schema.js');

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

    var schemaInfo = {
        schemaDefinition: null,
        schema: null,
        validate: ''
    };
    if (args.schema) {
        if (args.input && args.type) {
            //var inputUrl = new Url(args.input);
            appUrl = new Url(args.input);
            var ix = appUrl.path.lastIndexOf('/');
            if (ix == -1) ix = appUrl.path.lastIndexOf('\\');
            ix++;
            var inputName = appUrl.path.substring(ix);
            appUrl.path = appUrl.path.slice(0, ix);
            // validate type of definition against schema
            schemaInfo.schemaDefinition = args.schema;
            schemaInfo.validate = args.type;
            var errors = [];
            console.log(`Validate '${args.type}' from '${inputName}' against schema`);
            var schema = await Schema.load(schemaInfo, args.input, errors);
            if (schema && errors.length == 0) {
                console.log('* Validation successful!');
                // print types
                console.log('Simple Types');
                for (var i in schema.types) {
                    if (schema.types.hasOwnProperty(i) && schema.types[i].attributes == undefined && !schema.builtInTypes.includes(schema.types[i].name)) {
                        console.log('- ' + i);
                    }
                }
                console.log('Complex Types');
                for (var i in schema.types) {
                    if (schema.types.hasOwnProperty(i) && schema.types[i].attributes != undefined && !schema.builtInTypes.includes(schema.types[i].name)) {
                        console.log('- ' + i);
                    }
                }
            } else {
                console.log(errors.join('\n'));
            }
        } else {
            // validate schema

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