import json
import eventlet
import time
import base64

from flask import Flask, render_template, session, request, current_app
from flask_socketio import SocketIO, emit, disconnect

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
    socketio.emit("point_returned", { 'new_line': data }, namespace="/eq")

if __name__ == '__main__':
    socketio.run( app, port=8888, debug=True)
    