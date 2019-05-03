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
        console.log("webcam.width: " + webcam.width)
        console.log("webcam.height: " + webcam.height)
    } 

    setupWebcam();

    if ( !isFaceDetectionModelLoaded()) {
        addOutput("loading model(s)...")
        await faceapi.nets.tinyFaceDetector.load('static/models/')
        await faceapi.loadFaceLandmarkModel('static/models/')
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

function setupWebcam() {
    addOutput("setting up webcam...66")
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

    const results = await faceapi.detectAllFaces(webcam, options).withFaceLandmarks();

    if (results[0] ) {
        sketch.clearRect(0, 0, canvas.width, canvas.height);
        var points = results[0]["landmarks"]["positions"]
        sendpoints = {
            nose : points[30],
            chin : points[8],
            left_eye : points[36],
            right_eye : points[45],
            left_mouth : points[48],
            right_mouth : points[54],
            webcam_width : webcam.width,
            webcam_height : webcam.height
        };
        drawIndices(points)
        testSocket();
    }
    setTimeout( ()=> updateResults())
}

var sendpoints = null;

function drawIndices(points) {
    sketch.fillStyle = "#FFFFFF"
    sketch.font = "10px Sans-serif";
    for ( let x = 0; x < points.length; x++ ) {
        let p = points[x];
        sketch.fillText(x, p.x, p.y)
    }
    if ( sendpoints != null ) {
        drawForward(sendpoints["nose"])
    }
}

var socket = io.connect('http://' + document.domain + ":" + location.port + "/eq");

socket.on('connect', function() {
    console.log('connected');
});

socket.on('system_ready', function(data) {
    console.log("system status: " + data.status);
});

function testSocket() {
    console.log("to sending...")
    console.log(sendpoints);
    socket.emit("point_submit", { data: sendpoints })
}

function drawForward(point_nose) {
    sketch.beginPath();
    sketch.moveTo(point_nose._x, point_nose._y);
    sketch.lineTo(forwardX, forwardY);
    sketch.strokeStyle = "red";
    sketch.stroke();

}

var forwardX = 0;
var forwardY = 0;

socket.on('point_returned', function(dataraw) {
    data = JSON.parse(dataraw)
    forwardX = data.forward_x;
    forwardY = data.forward_y;
    txtOutput.innerText = forwardX + ", " + forwardY
});


document.addEventListener("DOMContentLoaded", (e)=> { setup(); })