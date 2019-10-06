const fs = require('fs');
const Syntax = require('./syntax.js');
const grammar = require('./grammar.js');

main();

function main() {
    //console.log(new Syntax(grammar).parse("1+2+3+4").resolve());
    var result = new Syntax(grammar).parse(process.argv[2]).resolve();
    console.log(`${process.argv[2]} = ${result}`);
    return;

    console.log('\n*** Ingatlan adatbázis');
    var cmd = process.argv[2];
    switch (cmd) {
        case 'a':
        case 'add':
            addDataFile(process.argv[3]);
            break;
        case 'q':
        case 'g':
        case 'get':
            queryData(process.argv.slice(3));
            break;
        default:
            console.log('Elérhető parancsok:\n -a/add: új JSON adat fájl hozzáadása\n -q/g/get: adatok lekérdezése\n\n');
    }
}

function addDataFile(path) {
    if (!fs.existsSync(path)) {
        console.error('\n*** A fájl nem található!\n\n');
        return;
    }
    var data = require(path);
    if (!Array.isArray(data)) {
        console.error('\n*** A fájl formátuma rossz, egy JSON tömböt várok!\n\n');
        return;
    }
    var database = [];
    if (!fs.existsSync('ingatlan_database.json')) {
        fs.openSync('ingatlan_database.json', 'w');
    } else {
        database = require('./ingatlan_database.json');
    }

    console.log(` * ${data.length} cím a fájlban.\n`);
    var cache = [];
    var updated = 0;
    var duplicated = 0;
    for (var i=0; i<data.length; i++) {
        var item = database.find( x => x.link == data[i].link );
        if (item == null) {
            database.push(data[i]);
            cache.push(data[i]);
        } else {
            var isUpdated = false;
            for (var a in item) {
                if (item[a] == '?' && data[i][a] != '?' || item[a] == '') {
                    console.log(`${a}: "${item[a]}" => "${data[i][a]}"`);
                    isUpdated = true;
                    item[a] = data[i][a];
                } else {
                }
            }
            if (isUpdated) {
                updated++;
                console.log(`Cím ${item.location}/${item.houseSize}/${item.lotSize} aktualizálva`);

            } else {
                duplicated++;
                console.log(`Cím már létezik: ${item.location}/${item.houseSize}/${item.lotSize}`);

            }
        }
    }
    console.log(` * ${cache.length} cím hozzáadva.\n`);
    console.log(` * ${updated} cím aktualizálva.\n`);
    console.log(` * ${duplicated} cím már létezett.\n`);

    if (database.length > 0) {
        fs.writeFileSync('ingatlan_database.json', JSON.stringify(database));
    }
}

function queryData(args) {
    const database = require('./ingatlan_database.json');
    var expr = args.join(' ');
    console.log(`Keresés: ${expr}`);
    var syntax = new Syntax(grammar);
    var nodes = syntax.parse(expr);
    var result = syntax.resolve(nodes);

    // var hits = [];
    // for (var i=0; i<database.length; i++) {
    //     if (formula.apply(database[i])) {
    //         hits.push(database[i]);
    //     }
    // }

    // if (hits.length == 0) {
    //     console.log(' * Nincs találat!\n\n');
    // } else {
    //     console.log(` * ${hits.length} találat\n`);
    //     for (var i=0; i<hits.length; i++) {
    //         var item = hits[i];
    //         console.log(`${item.location}/${item.houseSize}/${item.lotSize}/${item.price}`);
    //     }
    // }
}

// var output = {items:[]};
// for (var i=0; i<data.items.length; i++) {7
//     var item = data.items[i];
//     if (item.longitude == '?' || item.latitude == '?') {
//         item.longitude = undefined;
//         item.latitude = undefined;
//         output.items.push(item);
//     }
// }
// fs.writeFileSync('ingatlan_missing.json', JSON.stringify(output));

// var R = 6371e3; // metres
// var φ1 = lat1.toRadians();
// var φ2 = lat2.toRadians();
// var Δφ = (lat2-lat1).toRadians();
// var Δλ = (lon2-lon1).toRadians();
// var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
//         Math.cos(φ1) * Math.cos(φ2) *
//         Math.sin(Δλ/2) * Math.sin(Δλ/2);
// var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

// var d = R * c;