const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffprobe-static').path;
const ffmpeg = require('fluent-ffmpeg');

const carpetaConAudios = './audios';
const carpetaConJSON = './json';

ffmpeg.setFfprobePath(ffmpegPath);

function obtenerDuracionFormateada(duracionEnSegundos) {
    const minutos = String(Math.floor(duracionEnSegundos / 60)).padStart(2, '0');
    const segundos = String(Math.floor(duracionEnSegundos % 60)).padStart(2, '0');
    return `${minutos}:${segundos}`;
}

async function obtenerDuracionFormateadaAsync(rutaCompleta) {
    const metadata = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(rutaCompleta, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata);
        });
    });
    return obtenerDuracionFormateada(metadata.format.duration);
}

function obtenerInformacionDesdeJSON(rutaJSON) {
    const contenidoJSON = fs.readFileSync(rutaJSON, 'utf8');
    const { tituloLibro, temas } = JSON.parse(contenidoJSON);
    return { tituloLibro, temas };
}

async function generarArchivoJS() {
    try {
        const archivosJSON = await fs.promises.readdir(carpetaConJSON);

        for (const archivoJSON of archivosJSON) {
            const rutaCompletaJSON = path.join(carpetaConJSON, archivoJSON);
            const { tituloLibro, temas } = obtenerInformacionDesdeJSON(rutaCompletaJSON);

            const carpetaAudiosLibro = path.join(carpetaConAudios, tituloLibro, "/assets/audiolibro/temp");

            if (!fs.existsSync(carpetaAudiosLibro)) {
                console.log(`No se encontró la carpeta de audios para el libro ${tituloLibro}`);
                continue;
            }

            const temasContenido = [];

            for (let i = 0; i < temas.length; i++) {
                const tema = temas[i];
                const tituloTema = tema.titulo;
                const numAudio = i + 42;
                const archivoAudio = fs.readdirSync(carpetaAudiosLibro).find((archivo) => archivo.startsWith(`${numAudio}.`));

                if (archivoAudio) {
                    const rutaCompleta = path.join(carpetaAudiosLibro, archivoAudio);
                    try {
                        const duracionFormateada = await obtenerDuracionFormateadaAsync(rutaCompleta);
                        temasContenido.push({
                            Titulo: tituloTema,
                            archivo: archivoAudio,
                            tiempo: duracionFormateada,
                        });
                    } catch (err) {
                        console.error(`Error al obtener la duración de ${rutaCompleta}:`, err.message);
                    }
                } else {
                    console.log(`No se encontró el archivo de audio para el tema ${tituloTema}`);
                }
            }

            const archivoResultante = `Visor.audiosLibros=${JSON.stringify(temasContenido, null, 4)};`;

            const rutaArchivoJS = path.join(carpetaAudiosLibro, '../../audiolibros.js');
            await fs.promises.writeFile(rutaArchivoJS, archivoResultante, 'utf8');
            console.log(`\nArchivo JS para libro ${tituloLibro} hecho!`);
        }
    } catch (err) {
        console.error('Error al generar el archivo JS:', err.message);
    }
}

module.exports = {
    obtenerInformacionDesdeJSON,
    obtenerDuracionFormateadaAsync,
    generarArchivoJS,
};