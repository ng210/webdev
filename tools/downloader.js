const https = require('https');
const fs = require('fs');
const path = require('path');

const parallelDownloadCount = 2;
const targetPath = 'd:\\filmek\\DragonBall';

function print(text) {
    process.stdout.write(text);
}

function download(url) {
    return new Promise( (resolve, reject) => {
        var chunks = [];
        https.get(url, resp => {
            if (resp.statusCode != 200) {
                reject(new Error(resp.statusMessage));
            }
            resp.on('data', chunk => {
                chunks.push(chunk);
            });
            resp.on('end', () => {
                page = Buffer.concat(chunks).toString();
                resolve(page);
            })
            resp.on('error', err => reject(err));
        });
    })
}

function downloadVideo(url, filePath) {
    return new Promise( (resolve, reject) => {
        https.get(url, resp => {
            if (resp) {
                var videoUrl = resp.headers.location;
                print(` << File found '${videoUrl}'..\n`);
                const file = fs.createWriteStream(filePath);
                try {
                    https.get(videoUrl, videoResp => {
                        videoResp.on('error', err => reject(err));
                        videoResp.pipe(file);
                        file.on('finish', () => {
                            file.close();
                            print(` >> Download of '${filePath}' done.\n`);
                            resolve(videoUrl);
                        });
                    });
                } catch (err) {
                    reject(err);
                }
            } else {
                reject(new Error('No response!'));
            }            
        });
    });
}

async function main(start) {
    var nr = start || 1;
    var pageUrlParts = ['https://archive.org/', 'details/videoplaytv-dragon-ball-z-episode-', 1];

    //const urlParts = ["https://ia802304.us.archive.org/33/items/videoplaytv-dragon-ball-episode-", nr, "/%5BVideoplaytv%5DDragon%20Ball%20episode%20", nr, ".mp4"];
    var hasError = false;
    while (!hasError) {

        var threads = [];
        for (var i=0; i<parallelDownloadCount; i++) {
            // build page url
            pageUrlParts[2] = nr < 10 ? '0'+nr : nr;
            var url = pageUrlParts.join('');
            var ep = ('00' + nr).slice(-3);
            var filePath = path.resolve(targetPath, `DBZ-episode-${ep}.mp4`)
            if (!fs.existsSync(filePath)) {
                // get page
                try {
                    print(` ** Load page '${url}'.\n`);
                    var page = await download(url);
                    var m = page.match(/download\/videoplaytv-dragon-ball-z-episode-(\d+)\/%5BVideoplaytv%5DDragon%20Ball%20Z%20episode%20(\d+).mp4/);
                    if (m) {
                        url = pageUrlParts[0] + m[0];
                        threads.push(downloadVideo(url, filePath));
                    } else {
                        print('Could not parse page!\n');
                        hasError = true;
                        break;
                    }
                } catch (err) {
                    print(err.message + '\n');
                }
            } else {
                print(` ** File '${filePath}' already exists!\n`);
            }
            nr++;
        }
        await Promise.all(threads);
    }
}

main();
