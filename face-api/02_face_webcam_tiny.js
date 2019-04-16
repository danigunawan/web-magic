let webcam = null
let sketch = null
let canvas = null
let txtOutput = null
let btnFindFaces = null
let options = null
let inputSize = 256
let scoreThreshold = .5

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

    aspectRatio = webcam.width / webcam.height

    setupWebcam();

    if ( !isFaceDetectionModelLoaded()) {
        addOutput("loading model...")
        await faceapi.nets.tinyFaceDetector.load('/models/')
        options = new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
    }

    if ( !isFaceDetectionModelLoaded()) {
        addOutput("ERROR: model not loaded.")
        return
    }
    
    addOutput("ready.")
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
    return !!faceapi.nets.tinyFaceDetector.params
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

    const ts = Date.now()

    const results = await faceapi.detectSingleFace(webcam, options)
    if (results ) {
        if ( dump ) {
            console.log(results)
            console.log(results["_box"])
            dump = false;

            console.log("resize results ---")
            let foo = resizeCanvasAndResults(webcam, canvas, results);
            console.log(foo);

        }
        drawResults(results["_box"])    
    } else {
        sketch.clearRect(0, 0, canvas.width, canvas.height);
    }
    setTimeout( ()=> updateResults())
}

function resizeCanvasAndResults(dimensions, canvas, results) {
    const { width, height } = dimensions instanceof HTMLVideoElement
      ? faceapi.getMediaDimensions(dimensions)
      : dimensions
    canvas.width = width
    canvas.height = height
  
    // resize detections (and landmarks) in case displayed image is smaller than
    // original size
    return faceapi.resizeResults(results, { width, height })
  }

function drawResults(box) {
    sketch.clearRect(0, 0, canvas.width, canvas.height);
    if (sketch ) {
        sketch.strokeStyle = "#00aa0099"
        sketch.fillStyle = "#00aa0099"
        sketch.strokeRect(box.x, box.y, box.width, box.height)
        sketch.fillRect(box.x, box.y + box.height, box.width, 18)
        sketch.fillStyle = "#FFFFFF"
        sketch.fillText("additional info here", box.x + 4, box.y + box.height + 12);

    } else {
        addOutput("no drawing surface available.")
    }
}

let dump = false;

function dumpData() {
    dump = true;
}

document.addEventListener("DOMContentLoaded", (e)=> { setup(); })