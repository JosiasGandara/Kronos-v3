const ffmpegPath = require('ffprobe-static').path;
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const folderPath = './audios';

ffmpeg.setFfprobePath(ffmpegPath);

// Función asincrónica para procesar una carpeta y sus subcarpetas de manera recursiva
async function processFolderAsync(folderPath) {
    try {

        const entries = await fs.readdir(folderPath);
        await Promise.all(entries.map(async (entry) => {
            const entryPath = path.join(folderPath, entry);

            if ((await fs.stat(entryPath)).isDirectory()) {

                await processFolderAsync(entryPath);

            } else if (entry.endsWith('.mp3')) {

                const outputFile = path.join(folderPath, '..', entry);

                await new Promise((resolve, reject) => {
                    ffmpeg().input(entryPath).audioCodec('libmp3lame').on('end', () => {
                        resolve();
                    }).on('error', (err) => {
                        console.error(`Error al comprimir ${entry}: ${err}`);
                        reject(err);
                    }).save(outputFile);
                });
            }
        }));

        if (path.basename(folderPath) === 'temp') {
            await fs.remove(folderPath);
            console.log("\n======================================="+"\n==       Compresion terminada !      =="+"\n=======================================");
        }

    } catch (err) {
        console.error('Error al procesar la carpeta:', err);
    }
}

async function run() {
    console.log("\n======================================="+"\n== Comprimiendo archivos de audio... =="+"\n=======================================");
    await processFolderAsync(folderPath);
}

run();