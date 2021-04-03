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
             #2 node schema.js my-schema2.json my-input.json (first type in the schemais used).`
        );
    }
//         schemaInfo.schema = args.schema;
//         console.log(`- loading schema '${args.schema}'`);
//         var res = await load(args.schema);
//         if (checkError(res)) return;
//         schemaDefinition = res.data;
//     }

//     var input = null;
//     if (args.input) {
//         console.log(`- loading input '${args.input}'`);
//         res = await load(args.input);
//         if (checkError(res)) return;
//         input = res.data;
//     }

//     if (schemaDefinition && input) {
//         // validate type of definition against schema
//     } else {
//         // validate schema

//     }

//     var type = null;
//         var schema = null;
//         var typeCache = null;
//         try {
//             if (!Array.isArray(schemaDefinition)) {
//                 console.log('Schema definition has to be an array of type descriptions!');
//                 return;
//             }
//             console.log('\nBuilding schema');
//             schema = new Schema(schemaDefinition);
//             type = Object.values(schema.types)[0];
//             typeCache = Object.keys(schema.types);

//             console.log('Schema built successfully.')
//             console.log('Simple Types');
//             for (var i in schema.types) {
//                 if (schema.types.hasOwnProperty(i) && schema.types[i].attributes == undefined && !schema.builtInTypes.includes(schema.types[i].name)) {
//                     console.log('- ' + i);
//                 }
//             }
//             console.log('Complex Types');
//             for (var i in schema.types) {
//                 if (schema.types.hasOwnProperty(i) && schema.types[i].attributes != undefined && !schema.builtInTypes.includes(schema.types[i].name)) {
//                     console.log('- ' + i);
//                 }
//             }
//         } catch (err) {
//             console.log('Failed to build schema!')
//             console.log(err);
//         }

//         if (schema && input) {
//             if (process.argv.length > 4) {
//                 var t = schema.types[process.argv[4]];
//                 if (t != undefined) type = t;
//             }
//             console.log(`\nValidate input against '${type.name}'`);
//             var errors = null;
//             try {
//                 errors = type.validate(input);
//             } catch (err) {
//                 errors = [new Schema.ValidationResult(null, err.stack)];
//             }

//             if (errors.length > 0) {
//                 for (var i=0; i<errors.length; i++) {
//                     console.log(errors[i].toString());
//                 }
//             } else {
//                 console.log('* Validation successful!');
//                 var hasRunTimeType = false;
//                 for (var i in schema.types) {
//                     if (schema.types.hasOwnProperty(i) && !typeCache.includes(schema.types[i].name)) {
//                         if (!hasRunTimeType) {
//                             console.log('\nTypes defined in run-time')
//                             hasRunTimeType = true;
//                         }
//                         console.log('-' + schema.types[i].name);
//                     }
//                 }
//             }
//         }
//     } else {
//         console.log(
// `Usage
//  schema.js <schema-definition>.json [input.json] [type]
//  The <schema-definition> is a JSON file containing the types of the schema.
//  The [input.json] is a JSON file containing a JSON object to be validated against the schema.
//  If the schema contains more than 1 type at the top level the [type] selects the type for the validation, otherwise the first type is used.
//  Example
//  #1 node schema.js my-schema1.json my-input.json myType (myType from the schema is used).
//  #2 node schema.js my-schema2.json my-input.json (first type in the schemais used).`
// );
//     }
}

run(main);