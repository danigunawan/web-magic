let webcam = null
let sketch = null
let canvas = null
let txtOutput = null
let btnFindFaces = null
let options = null
let inputSize = 640
let scoreThreshold = .5
let fadeCount = 0

const minConfidence = .5

async function setup() {

    canvas = document.getElementById('canvas')
    webcam = document.getElementById('webcam')
    txtOutput = document.getElementById('txtOutput')
    btnFindFaces = document.getElementById('btnFindFaces')

    if ( canvas.getContext) {
        canvas.width = webcam.width;
        canvas.height = webcam.height;
        sketch = canvas.getContext('2d')
        sketch.font = "11px Sans-serif";
    } 

    setupWebcam();

    if ( !isFaceDetectionModelLoaded()) {
        addOutput("loading model(s)...")
        await faceapi.nets.tinyFaceDetector.load('/models/')
        await faceapi.loadFaceLandmarkModel("/models/")
        options = new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
    }

    if ( !isFaceDetectionModelLoaded()) {
        addOutput("ERROR: model not loaded.")
        return
    }
    
    addOutput("ready.")
    updateResults()
}

function sayReady() {
    console.log("webcam ready..........")
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

function findFaces() {
    txtOutput.innerText = "";
    addOutput("realtime tracking on webcam...")
    updateResults();
}

async function updateResults() {

    if ( webcam.paused || webcam.ended || !isFaceDetectionModelLoaded()) {
        console.log("can't process webcam image yet...")
        return setTimeout( () => updateResults() )
    }

    const results = await faceapi.detectAllFaces(webcam, options).withFaceLandmarks()
    if (results[0] ) {
        fadeCount = 5;
        sketch.clearRect(0, 0, canvas.width, canvas.height);
        if ( dump ) {
            console.log(`length: ${results.length}`);
            dump = false;
        }
        for ( let i = 0; i < results.length; i++ ) {
            const aRect = results[i]["alignedRect"]
            if (aRect) {
                const score = aRect["classScore"]
                if ( score < .65 ) continue;
                const box = aRect["box"]
                if ( box ) {
                    drawBBox(box, aRect["classScore"])
                }
            }
            drawPoints(results[i]["landmarks"]["positions"])
        } 
    } else {
        if ( fadeCount > 0) {
            fadeCount--;
            if ( fadeCount == 0 ) {
                sketch.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }
    setTimeout( ()=> updateResults())
}

function drawPoints(points) {
    sketch.fillStyle = "FF0000"
    for ( let x = 0; x < points.length; x++ ) {
        let p = points[x];
        sketch.fillRect(p.x - 1, p.y-2, 4, 4 )
    }
}

function drawBBox(box, perc) {
    if (sketch ) {
        sketch.strokeStyle = "#00aa0099"
        sketch.fillStyle = "#00aa0099"
        sketch.strokeRect(box.x, box.y, box.width, box.height)
        sketch.fillRect(box.x, box.y + box.height, box.width, 18)
        sketch.fillStyle = "#FFFFFF"
        sketch.fillText(`score: ${parseFloat(perc*100).toFixed(2)}`, box.x + 4, box.y + box.height + 12);

    } else {
        addOutput("no drawing surface available.")
    }
}

let dump = false;

function dumpData() {
    dump = true;
}

document.addEventListener("DOMContentLoaded", (e)=> { setup(); })