let webcam = null
let sketch = null
let canvas = null
let txtOutput = null
let btnFindFaces = null
let options = null

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
    } else {
        addOutput("app requires canvas and image elements to proceed...")
        return
    }

    addOutput("setting up webcam...")
    await setupWebcam();

    if ( !isFaceDetectionModelLoaded()) {
        addOutput("loading model...")
        await faceapi.nets.ssdMobilenetv1.load('/models/')
    }

    if ( !isFaceDetectionModelLoaded()) {
        addOutput("ERROR: model not loaded.")
        return
    }
    addOutput("preparing model options...")
    options = new faceapi.SsdMobilenetv1Options({ minConfidence })

    addOutput("ready.")
}

async function setupWebcam() {
    return new Promise((resolve, reject) => {
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
        console.log(`width: ${webcam.width}  height: ${webcam.height}`);
    });
}

function addOutput(newLine) {
    var line = document.createElement("P");
    line.innerText = `=> ${newLine}`;
    txtOutput.appendChild(line);
}

function isFaceDetectionModelLoaded() {
    return !!faceapi.nets.ssdMobilenetv1.params
}

function findFaces() {
    txtOutput.innerText = "";
    addOutput("realtime tracking on webcam...")
    updateResults();
}

async function updateResults() {

    while (true) {
        const results = await faceapi.detectAllFaces(webcam, options)
        drawResults(results[0]["_box"])    
    }
}

function drawResults(box) {
    sketch.clearRect(0, 0, canvas.width, canvas.height);
    if (sketch ) {
        sketch.strokeStyle = "#00000099"
        sketch.fillStyle = "#00000099"
        sketch.strokeRect(box.x, box.y, box.width, box.height)
        sketch.fillRect(box.x, box.y + box.height, box.width, 18)
        sketch.fillStyle = "#FFFFFF"
        sketch.fillText("additional info here", box.x + 4, box.y + box.height + 12);

    } else {
        addOutput("no drawing surface available.")
    }
}


document.addEventListener("DOMContentLoaded", (e)=> { setup(); })