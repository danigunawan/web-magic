import json
import eventlet
import time
import base64

import cv2
import numpy as np

from flask import Flask, render_template, session, request, current_app
from flask_socketio import SocketIO, emit, disconnect

# from flask_cors import CORS
# cors = CORS(app, resources={r"/static/*": {"origins": "*"}})

eventlet.monkey_patch()

import numpy as np

app = Flask(__name__,
    template_folder = "./templates",
    static_folder = "./static")

socketio = SocketIO(app, async_mode="eventlet")

@app.before_first_request
def initializeServer():
    print("-------------------------------\n")
    print("INITIALIZING SERVER")
    print("-------------------------------\n")

@app.route('/')
def index():
    return render_template('webcam.html')

@socketio.on('connect', namespace="/eq")
def app_connect():
    # do something connection specific here...
    socketio.emit('system_ready', {'status': 'connected'}, namespace='/eq')

@socketio.on('point_submit', namespace='/eq')
def point_submit(data):
    response = getFace(data["data"])
    socketio.emit("point_returned", response, namespace="/eq")

@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r

# ============================================================
def getFace(data):

    # im = cv2.imread("headPose.jpg")
    # size = im.shape

    size = (data["webcam_height"], data["webcam_width"], 3)

    image_points = np.array([
        (data["nose"]["_x"],data["nose"]["_y"]),                # Nose 
        (data["chin"]["_x"],data["chin"]["_y"]),                # chin
        (data["left_eye"]["_x"],data["left_eye"]["_y"]),        # left eye left
        (data["right_eye"]["_x"],data["right_eye"]["_y"]),      # rigth eye right
        (data["left_mouth"]["_x"],data["left_mouth"]["_y"]),    # left mouth corner
        (data["right_mouth"]["_x"],data["right_mouth"]["_y"])   # right mouth corner
        ], dtype="double")

    model_points = np.array([
        (0.0, 0.0, 0.0),
        (0.0, -330.0, -65.0),
        (-225.0, 170.0, -135.0),
        (225.0, 170.0, -135.0),
        (-150.0, -150.0, -125.0),
        (150.0, -150.0, -125.0),
        ])

    # Camera internals
    focal_length = size[1]
    # print("focal_length: ", focal_length)

    center = ( size[1]/2, size[0]/2)
    # print("center: ", center)

    camera_matrix = np.array(
        [ [focal_length, 0, center[0]],
        [0, focal_length, center[1]],
        [0,  0,  1]], dtype="double"
    )
    # print("Camera Matrix: ", camera_matrix)

    dist_coeffs = np.zeros((4,1)) 
    (success, rotation_vector, translation_vector) = cv2.solvePnP(model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE)

    print("Rotation Vector: ", rotation_vector )
    print("Translation Vector: ", translation_vector)

    # project a 3D point (0,0,1000) onto the image plane.
    # We use this to draw a line sticking out of the nose.
    (nose_end_point2D, jacobian) = cv2.projectPoints(np.array([ (0.0, 0.0, 500.0) ]), rotation_vector, translation_vector, camera_matrix, dist_coeffs)

    bundle = {
    "rot1" : rotation_vector[0][0],
    "rot2" : rotation_vector[1][0],
    'rot3' : rotation_vector[2][0],
    'trans1' : translation_vector[0][0],
    'trans2' : translation_vector[1][0],
    'trans3' : translation_vector[2][0],
    'forward_x' : nose_end_point2D[0][0][0],
    'forward_y' : nose_end_point2D[0][0][1]
    }

    bundleformat = json.dumps(bundle)

    return bundleformat
    

if __name__ == '__main__':
    socketio.run( app, port=8888, debug=True)
    