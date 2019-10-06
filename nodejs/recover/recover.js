const fs = require('fs');
const path = require('path');

var rootDir = 'F:\\Users';
var workDir = 'D:\\vissza';
var input = 'D:\\code\\git\\webdev\\nodejs\\recover\\deleted_files.txt';

fs.writeFileSync('recover.log', 'PROCESS INPUT', {encoding: 'UTF8'});
var file = fs.readFileSync(input, {encoding: 'UTF8'});
var lines = file.split('\n');
for (var li=0; li<lines.length; li++) {
    try {
        var line = lines[li];
        var tokens = line.split(';');
        if (tokens.length == 3) {
            var source = `${workDir}\\${tokens[0]}`;
            log(`PROCESSING '${source}'`);
            if (fs.existsSync(`${source}`)) {
                var destination = tokens[2].replace(rootDir, workDir);
                if (destination.endsWith('\\\r')) {
                    destination = destination.substr(0, destination.length-2);
                }
                if (!fs.existsSync(destination)) {
                    log(`MKDIR '${destination}'`);
                    fs.mkdirSync(destination, { recursive: true });
                }
                destination = path.join(destination, tokens[0]);
                log(`COPY '${source}' TO '${destination}'`);
                fs.copyFileSync(`${source}`, `${destination}`);
            } else {
                log(` *** '${source}' NOT FOUND`);
            }
        } else {
            log(`CORRUPT DATA '${line}'`);
        }
    } catch (error) {
        log(error.message);
    }
    
}


function log(text) {
    var log = fs.writeFileSync('recover.log', text+'\n', {encoding: 'UTF8', flag:'a+'});
}