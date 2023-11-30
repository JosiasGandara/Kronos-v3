/*
 * @Author: Josias Emiliano Gandara Raygoza
 ? @Version: 2.0.0
 * @Description:
 *      Este script genera un archivo JSON con código autogenerado necesario
 *      para que la aplicación Kronos-v3 corra y genere el audiolibro.      
*/

main();

function main() {
	if (app.documents.length != 0) {
		indice();
	} else {
		alert("Por favor, abra un documento.");
	}
}

function cleanArray(actual) {
    var newArray = new Array();
    for( var i = 0, j = actual.length; i < j; i++ ){
        if (actual[i]) {
            newArray.push(actual[i]);
        }
    }
    return newArray;
}

function indice() {

	var document = app.activeDocument;
	var pages = document.pages;
	var fileNameOrigen = document.name.split(".");
	var startJson = '{\n\t"tituloLibro": "' + fileNameOrigen[0] + '",\n\t"temas": [';
	var arregloTemp = [], arregloTitulos = [], arregloContenidos = [];
	var currentTitulo = null, currentContenido = "", tituloSig = "";
	var excluirBiblio = /(B|b)ibliograf(i|í)a\.?/gi;
	var introduccion = /Introducci(ó|o)n/gi;

	for (var a = 0; a < pages.length; a++) {

        for (var b = 0; b < pages[a].textFrames.length; b++) {
            
            for(var c = 0; c < pages[a].textFrames[b].lines.length; c++) {

                var frameName = "";
                var line = pages[a].textFrames[b].lines[c];
                var paragraphStyle = pages[a].textFrames[b].lines[c].appliedParagraphStyle.name;

                try {

                    if(line.contents.replace(/(\r\n|\n|\r)/gm, "") != tituloSig) {
                    
                        if((paragraphStyle == 'Nombre del libro' || paragraphStyle == 'Título de unidad' || paragraphStyle == 'Título') && !excluirBiblio.test(line.contents)) {

                            for(var d = c; d < pages[a].textFrames[b].lines.length; d++){
                                
                                line = pages[a].textFrames[b].lines[d];
                                paragraphStyle = pages[a].textFrames[b].lines[d].appliedParagraphStyle.name;

                                if(paragraphStyle != 'Nombre del libro' && paragraphStyle != 'Título de unidad' && paragraphStyle != 'Título') {
                                    break;
                                } else if (!excluirBiblio.test(line.contents)) {

                                    var titulo = line.contents.replace(/(\r\n|\n|\r|\")/gm, "");

                                    if (/(S|s)iglo\sXXI/gm.test(titulo)) {
                                        titulo = titulo.replace(/XXI/gm, "21");
                                    } else if (/(S|s)iglo\sXX/gm.test(titulo)) {
                                        titulo = titulo.replace(/XX/gm, "20");
                                    } else if (/(S|s)iglo\sXIX/gm.test(titulo)) {
                                        titulo = titulo.replace(/XIX/gm, "19");
                                    } else if (/(S|s)iglo\sXVIII/gm.test(titulo)) {
                                        titulo = titulo.replace(/XVIII/gm, "18");
                                    } else if (/(S|s)iglo\sXVII/gm.test(titulo)) {
                                        titulo = titulo.replace(/XVII/gm, "17");
                                    } else if (/(S|s)iglo\sXVI/gm.test(titulo)) {
                                        titulo = titulo.replace(/XVI/gm, "16");
                                    } else if (/(S|s)iglo\sXV/gm.test(titulo)) {
                                        titulo = titulo.replace(/XV/gm, "15");
                                    }
                                    
                                    if(pages[a].textFrames[b].lines[d + 1].appliedParagraphStyle.name == 'Introducción de unidad' || pages[a].textFrames[b].lines[d + 1].appliedParagraphStyle.name == 'Introducción general') {
                                        titulo += ' ' + pages[a].textFrames[b].lines[d + 2].contents;
                                    }

                                    if(paragraphStyle == 'Título' && pages[a].textFrames[b].lines[d - 1].appliedParagraphStyle.name == 'Número título') {
                                        var numero = pages[a].textFrames[b].lines[d - 1].contents.replace(/(\r\n|\n|\r|\")/gm, "");
                                        titulo = numero + ' ' + titulo;
                                    }

                                    arregloTemp.push(titulo);

                                }
        
                            }
                            frameName = arregloTemp.join("");
                            c = d;
                        }
    
                        if (frameName.length > 1 && /\.+\s*$/.test(frameName)) {
                            frameName = frameName.replace(/\.+\s*$/, ".");
                            arregloTemp = [];
                            arregloTitulos.push(frameName);
                        } else if(frameName.length > 1){
                            frameName += ".";
                            arregloTemp = [];
                            arregloTitulos.push(frameName);
                        }
    
                    }
                } catch (e) {
                    alert("Error: " + e.message);
                } 
    
            }

        }

    }

    for (var a = 0; a < pages.length; a++) {

        for (var b = 0; b < pages[a].textFrames.length; b++) {

            for (var c = 0; c < pages[a].textFrames[b].lines.length; c++) {
                
                var line = pages[a].textFrames[b].lines[c];
                var paragraphStyle = line.appliedParagraphStyle.name;

                if ((paragraphStyle == 'Nombre del libro' || paragraphStyle == 'Título de unidad' || paragraphStyle == 'Título') && line.length > 1) {
                    if (currentTitulo !== null) {
						currentContenido = currentContenido.replace(/\s+/g, ' ');
                        arregloContenidos.push(currentContenido);
                    }
                    currentTitulo = line.contents.replace(/(\r\n|\n|\r)/gm, "");
                    currentContenido = "";
                } else if ((paragraphStyle == "Primer párrafo unidad" || paragraphStyle == "Cuerpo de texto" || paragraphStyle == "Lista" || paragraphStyle == "Primer párrafo después de sumario" || paragraphStyle == "Subtítulo" || paragraphStyle == "Caso de estudio / clínico" || paragraphStyle == "Sumario") && line.length > 1) {
                    currentContenido += line.contents.replace(/(\r\n|\n|\r|\")/gm, "") + " ";
                }
            }
        }
    }

    if (currentTitulo !== null) {
		currentContenido = currentContenido.replace(/\s+/g, ' ');
        arregloContenidos.push(currentContenido);
    }

    arregloContenidos = cleanArray(arregloContenidos);

	for(var i = 0; i < arregloTitulos.length; i++){
		startJson += '\n\t\t{\n\t\t\t"titulo": "' + arregloTitulos[i] + '",' + '\n\t\t\t"contenido": "' + arregloTitulos[i] + ' ' + arregloContenidos[i] + '"\n\t\t},';
	}

	startJson = startJson.replace(/,$/, "");
	startJson += '\n\t]\n}';

	var fileName = "/" + fileNameOrigen[0] + ".json";
	var path = Folder.selectDialog("Selecciona la carpeta para guardar el archivo");

	if (path != null) {
		var file = new File(path.fsName + fileName);
		file.encoding = "UTF-8";
		file.open("w");
		file.write(startJson);
		file.close();
		alert("Archivo guardado en: " + file.fsName);
	} else {
		alert("Por favor, seleccione una carpeta.");
	}
}