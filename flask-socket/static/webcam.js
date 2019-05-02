let webcam = null
let sketch = null
let canvas = null
let txtOutput = null

let options = null
let inputSize = 320
let scoreThreshold = .5

const minConfidence = .5

let faceMatcher = null;


async function setup() {

    canvas = document.getElementById('canvas')
    webcam = document.getElementById('webcam')
    txtOutput = document.getElementById('txtOutput')

    if ( canvas.getContext) {
        canvas.width = webcam.width;
        canvas.height = webcam.height;
        sketch = canvas.getContext('2d')
        sketch.font = "11px Sans-serif";
    } 

    setupWebcam();

    if ( !isFaceDetectionModelLoaded()) {
        addOutput("loading model(s)...")
        await faceapi.nets.tinyFaceDetector.load('static/models/')
        await faceapi.loadFaceLandmarkModel('static/models/')
        await faceapi.loadFaceRecognitionModel('static/models/')
        options = new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
    }

    if ( !isFaceDetectionModelLoaded()) {
        addOutput("ERROR: model not loaded.")
        return
    }
    
    addOutput("framework ready...")
    updateResults()
}

function sayReady() {
    console.log("webcam ready...")
    addOutput("webcam ready...")
}

let showingID = 1;

function showOption(index) {
    console.log(`show option ${index}`)
    showingID = index;
}

function setupWebcam() {
    addOutput("setting up webcam...")
    return new Promise( (resolve, reject) => {
        const navigatorAny = navigator;
        navigator.getUserMedia = navigator.getUserMedia || navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
        navigatorAny.msGetUserMedia;
        if ( navigator.getUserMedia) {
            navigator.getUserMedia({video:true},
                stream => {
                    webcam.srcObject = stream;
                    webcam.addEventListener('loadeddata', () => resolve(), false);
                },
                error => reject());
        } else {
            reject();
        }
    })
}

function addOutput(newLine) {
    var line = document.createElement("P");
    line.innerText = `=> ${newLine}`;
    txtOutput.appendChild(line);
}

function isFaceDetectionModelLoaded() {
    return !!faceapi.nets.faceLandmark68Net.params
}

let ModelReady = false;


var foob = true;

async function updateResults() {

    if (!ModelReady) {

        if ( webcam.paused || webcam.ended || !isFaceDetectionModelLoaded()) {
            console.log("can't process webcam image yet...")
        } else {
            addOutput("Landmark tracking online!")
            ModelReady = true;
        }
        return setTimeout( () => updateResults() )
    }

    const results = await faceapi.detectAllFaces(webcam, options).withFaceLandmarks().withFaceDescriptors();

    if (results[0] ) {

        if ( foob == true ) {
            console.log("boom:")
            console.log(results);
            foob = false;
        }

        sketch.clearRect(0, 0, canvas.width, canvas.height);
        for ( let i = 0; i < results.length; i++)
        {
            switch ( showingID) {
                case 1:
                    drawBBox(results[i]["alignedRect"]["box"], results[i]["alignedRect"]["classScore"]) 
                    break;
                case 2:
                    drawPoints(results[i]["landmarks"]["positions"])
                    break;
                case 3:
                    drawIndices(results[i]["landmarks"]["positions"])
                    break;
                case 4:
                    drawMesh(results[i]["landmarks"]["positions"])
                    break;
            }
        }
    } else { console.log("no result obtained")}
    setTimeout( ()=> updateResults())
}

function drawIndices(points) {
    sketch.fillStyle = "#FFFFFF"
    sketch.font = "8px Sans-serif";
    for ( let x = 0; x < points.length; x++ ) {
        let p = points[x];
        sketch.fillText(x, p.x, p.y)
    }
}

function drawPoints(points) {
    sketch.fillStyle = "#00FFFF"
    for ( let x = 0; x < points.length; x++ ) {
        let p = points[x];
        sketch.fillRect(p.x - 1, p.y-1, 2, 2 )
    }
}


function drawMesh(points) {

    sketch.strokeStyle = "#FFFFFF88"
    sketch.lineWidth = 1;

    // DRAW JAW LINE
    var pathString = `m ${points[1].x} ${points[1].y} `
    for ( let x = 2; x < 16; x++ ) {
        pathString += `L ${points[x].x} ${points[x].y}`        
    }
    sketch.stroke(new Path2D(pathString));
    
    // DRAW LEFT EYE LOOP
    pathString = `m ${points[36].x} ${points[36].y} `
    for ( let x = 37; x < 42; x++ ) {
        pathString += `L ${points[x].x} ${points[x].y}`        
    }
    pathString += "z";
    sketch.stroke(new Path2D(pathString));

    // DRAW RIGHT EYE LOOP
    pathString = `m ${points[42].x} ${points[42].y} `
    for ( let x = 43; x < 48; x++ ) {
        pathString += `L ${points[x].x} ${points[x].y}`        
    }
    pathString += "z";
    sketch.stroke(new Path2D(pathString));
    
    // DRAW EYE BROWS TOP
    pathString = `m ${points[0].x} ${points[0].y} `
    for ( let x = 17; x < 27; x++ ) { 
        pathString += `L ${points[x].x} ${points[x].y}` 
    }
    pathString += `L ${points[16].x} ${points[16].y}` 
    sketch.stroke(new Path2D(pathString));
    
    
    // DRAW LEFT EYE HOOD
    pathString = `m ${points[21].x} ${points[21].y} L ${points[27].x} ${points[27].y}` 
    let downCount = 21;
    for ( let x = 39; x > 35; x-- ) { 
        pathString += `L ${points[x].x} ${points[x].y}` 
        pathString += `L ${points[downCount].x} ${points[downCount].y}` 
        downCount--
    }
    sketch.stroke(new Path2D(pathString));

    
    // DRAW RIGHT EYE HOOD
    pathString = `m ${points[27].x} ${points[27].y}` 
    downCount = 22;
    for ( let x = 42; x < 46; x++ ) { 
        pathString += `L ${points[x].x} ${points[x].y}` 
        pathString += `L ${points[downCount].x} ${points[downCount].y}` 
        downCount++;
    }
    sketch.stroke(new Path2D(pathString));
    
    // DRAW NOSE LINE
    pathString = `m ${points[22].x} ${points[22].y} `
    for ( let x = 27; x <= 30; x++ ) { pathString += `L ${points[x].x} ${points[x].y}` }   
    sketch.stroke(new Path2D(pathString));
    sketch.stroke(new Path2D(`m${points[31].x} ${points[31].y} L ${points[33].x} ${points[33].y} L ${points[35].x} ${points[35].y} `))
 
    // DRAW MOUTH LOOP
    pathString = `m ${points[48].x} ${points[48].y}` 
    for ( let x = 49; x < 68; x++ ) { 
        pathString += `L ${points[x].x} ${points[x].y}` 
    }
    sketch.stroke(new Path2D(pathString));

    // DRAW BLUE CONTOURS
    sketch.strokeStyle = "#00FFFF66"
    sketch.stroke(new Path2D(`m${points[1].x} ${points[1].y} L ${points[8].x} ${points[8].y} L ${points[15].x} ${points[15].y} z`))

    sketch.stroke(new Path2D(`m${points[30].x} ${points[30].y} L ${points[39].x} ${points[39].y} L ${points[31].x} ${points[31].y} z`))
    sketch.stroke(new Path2D(`m${points[30].x} ${points[30].y} L ${points[42].x} ${points[42].y} L ${points[35].x} ${points[35].y} z`))
    sketch.stroke(new Path2D(`m${points[36].x} ${points[36].y} L ${points[0].x} ${points[0].y} L ${points[31].x} ${points[31].y} L ${points[48].x} ${points[48].y}`))
    sketch.stroke(new Path2D(`m${points[45].x} ${points[45].y} L ${points[16].x} ${points[16].y} L ${points[35].x} ${points[35].y} L ${points[54].x} ${points[54].y}`))
    sketch.stroke(new Path2D(`m${points[30].x} ${points[30].y} L ${points[33].x} ${points[33].y} L ${points[51].x} ${points[51].y}`))

}

function drawBBox(box, perc) {
    //console.log(box);
    sketch.clearRect(0, 0, canvas.width, canvas.height);
    if (sketch ) {
        sketch.strokeStyle = "#00aa0099"
        sketch.fillStyle = "#00aa0099"
        sketch.strokeRect(box.x, box.y, box.width, box.height)
        sketch.fillRect(box.x, box.y + box.height, box.width, 18)
        sketch.fillStyle = "#FFFFFF"
        sketch.font = "11px Sans-serif";
        sketch.fillText(`score: ${parseFloat(perc*100).toFixed(4)}`, box.x + 4, box.y + box.height + 12);

    } else {
        addOutput("no drawing surface available.")
    }
}


document.addEventListener("DOMContentLoaded", (e)=> { setup(); })