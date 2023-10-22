const fs = require("fs").promises;
const path = require("path");
const { SpeechSynthesisOutputFormat, SpeechConfig, AudioConfig, SpeechSynthesizer } = require("microsoft-cognitiveservices-speech-sdk");
const { generarArchivoJS } = require('./scripts/CreateJSFile');

async function azureTextToSpeech(arrayTemas, jsonFilePath) {
    if (arrayTemas && arrayTemas.temas && Array.isArray(arrayTemas.temas)) {
        const speechConfig = SpeechConfig.fromSubscription("fe6980690c2f4bd584a0bc72edf88e5b", "eastus");
        speechConfig.speechSynthesisOutputFormat = SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;
        speechConfig.speechSynthesisVoiceName = "es-MX-JorgeNeural";

        const jsonFileName = path.basename(jsonFilePath, path.extname(jsonFilePath));
        const folderPath = path.join("audios", jsonFileName, "/assets/audiolibro/temp");
    
        try {
            await fs.access(folderPath);
            console.log(`Carpeta existente: ${folderPath}\n`);
        } catch (error) {
            try {
                await fs.mkdir(folderPath, { recursive: true });
                console.log(`Carpeta creada: ${folderPath}\n`);
            } catch (error) {
                console.error("Error al crear la carpeta:", error);
                return;
            }
        }
        for (let i = 0; i < arrayTemas.temas.length; i++) {
            const tema = arrayTemas.temas[i];
            const text = tema.contenido;
            const audioFileName = `${i + 1}`;

            const audioConfig = AudioConfig.fromAudioFileOutput(path.join(folderPath, `${audioFileName}.mp3`));
            const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
        
            await getAudios(synthesizer, text, audioFileName);
        }
    } else {
        console.error("El formato del archivo JSON es incorrecto o no contiene la propiedad 'temas'.");
        return;
    }    
}

async function getAudios(synthesizer, text, audioFileName) {
    const sentences = text.match(/.*?[.!?](?=\s|$)/g);

    if (!sentences || sentences.length === 0) {
        console.log("No se encontraron oraciones en el texto.");
        return;
    }
    console.log(`Creando audio #${audioFileName} =>`);

    const speakPromises = sentences.map((sentence) => {
        return new Promise((resolve, reject) => {
            synthesizer.speakTextAsync(sentence, (result) => {
                if (result) {
                    resolve();
                } else {
                    console.log(`Error al crear el audio para la oración "${sentence}".`);
                    resolve();
                }
            });
        });
    });

    try {
        await Promise.all(speakPromises);
        console.log(`  - Audio #${audioFileName} creado correctamente`);
        console.log(`==================================`);
    } catch (error) {
        console.error("Error al sintetizar el discurso: ", error);
    }
}


async function loadJSONFile(filePath) {
	try {
		const data = await fs.readFile(filePath, "utf8");
		return JSON.parse(data);
	} catch (error) {
		throw error;
	}
}

async function main() {
    try {
		const jsonFolderPath = path.join("Kronos-v3", "../json/");
		const files = await fs.readdir(jsonFolderPath);
		const jsonFiles = files.filter((file) => path.extname(file) === ".json");

		if (jsonFiles.length === 0) {
			console.error("No se encontraron archivos JSON en la carpeta.");
			return;
		}

		for (const jsonFileName of jsonFiles) {
			const jsonFilePath = path.join(jsonFolderPath, jsonFileName);
			console.log("Procesando archivo JSON:", jsonFilePath);

			try {
				const arrayTemas = await loadJSONFile(jsonFilePath);
				await azureTextToSpeech(arrayTemas, jsonFilePath);
				await generarArchivoJS();
                console.log(`Audiolibro ${jsonFileName.replace('.json', '')} hecho!`);
			} catch (error) {
				console.error("Error al procesar el archivo JSON: ", jsonFilePath);
				console.error(error);
			}
            
		}
	} catch (error) {
		console.error("Error al leer la carpeta de archivos JSON:", error);
	} finally {
        process.exit();
    }
    
}

async function run() {
    await main();
}

run();