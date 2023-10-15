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

function cleanArray(actual){
    var newArray = new Array();
    for( var i = 0, j = actual.length; i < j; i++ ){
        if (actual[i]){
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
                    
                        if((paragraphStyle == 'Título' || paragraphStyle == 'Subtítulo indice') && !excluirBiblio.test(line.contents)) {
                
                            for(var d = c; d < pages[a].textFrames[b].lines.length; d++){
                                
                                line = pages[a].textFrames[b].lines[d];
                                paragraphStyle = pages[a].textFrames[b].lines[d].appliedParagraphStyle.name;

                                if(paragraphStyle != 'Título' && paragraphStyle != 'Subtítulo indice') {
                                    break;
                                } else if (!excluirBiblio.test(line.contents)) {
    
                                    var titulo = line.contents.replace(/(\r\n|\n|\r)/gm, "");
                                    
                                    if (/(U|u)nidad\sI\./gm.test(titulo)) {
                                        titulo = titulo.replace(/I\./gm, "1.");
                                    } else if (/(U|u)nidad\sII\./gm.test(titulo)) {
                                        titulo = titulo.replace(/II\./gm, "2.");
                                    } else if (/(U|u)nidad\sIII\./gm.test(titulo)) {
                                        titulo = titulo.replace(/III\./gm, "3.");
                                    }
                                    
                                    if (!introduccion.test(titulo)) {
                                        arregloTemp.push(titulo);
                                    } else {
                                        titulo = " " + titulo;
                                        arregloTemp.push(titulo);
                                    }
                                    
                                }
        
                                if(d == pages[a].textFrames[b].lines.length - 1) {

                                    for(var i = 0; i < pages[a+1].textFrames.length; i++) {

                                        if((pages[a+1].textFrames[i].lines[0].appliedParagraphStyle.name == 'Título' || pages[a+1].textFrames[i].lines[0].appliedParagraphStyle.name == 'Subtítulo indice')) {
                                            tituloSig = pages[a+1].textFrames[i].lines[0].contents.replace(/(\r\n|\n|\r)/gm, "");
                                            arregloTemp.push(tituloSig);
                                            break;
                                        }
                                        
                                    }

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
                    alert("Error: " + e.message + "\nPagina: " + a);
                } 
    
            }

        }

    }

    for (var a = 0; a < pages.length; a++) {

        for (var b = 0; b < pages[a].textFrames.length; b++) {

            for (var c = 0; c < pages[a].textFrames[b].lines.length; c++) {
                
                var line = pages[a].textFrames[b].lines[c];
                var paragraphStyle = line.appliedParagraphStyle.name;

                if ((paragraphStyle == "Título" && line.length > 1)||(paragraphStyle == "Subtítulo indice" && line.length > 1)) {
                    if (currentTitulo !== null) {
						currentContenido = currentContenido.replace(/\s+/g, ' ');
                        arregloContenidos.push(currentContenido);
                    }
                    currentTitulo = line.contents.replace(/(\r\n|\n|\r)/gm, "");
                    currentContenido = "";
                } else if ((paragraphStyle == "Primer Párrafo" || paragraphStyle == "Cuerpo de Texto" || paragraphStyle == "Subtítulo" || paragraphStyle == "Inciso" || paragraphStyle == "Inciso Número Comienzo" || paragraphStyle == "Inciso Número Continuación" || paragraphStyle == "Inciso Letra Comienzo" || paragraphStyle == "Inciso Letra Continuación") && line.length > 1) {
                    currentContenido += line.contents.replace(/(\r\n|\n|\r)/gm, "") + " ";
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