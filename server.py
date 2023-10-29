import sys, os, json, argparse
from threading import Timer, Lock

from flask import Flask, render_template, request
from flask import Response, stream_with_context
from waitress import serve
import webbrowser

import torch

from backend.models import update_model, load_models, get_model_info, list_models, remove_model, load_model, unload_model
from backend.config import set_config_dir, global_state
from backend.sessions import list_sessions, set_session, get_session, get_default_session_settings, new_session, delete_session
from backend.prompts import list_prompt_formats

app = Flask("ExUI")
app.static_folder = 'static'
api_lock = Lock()

parser = argparse.ArgumentParser(description="ExUI, chatbot UI for ExLlamaV2")
parser.add_argument("-host", "--host", type = str, help = "IP:PORT eg, 0.0.0.0:5000", default = "localhost:5000")
parser.add_argument("-d", "--dir", type = str, help = "Location for user data and sessions, default: ~/exui", default = "~/exui")
args = parser.parse_args()

@app.route("/api/delete_block", methods=['POST'])
def api_delete_block():
    global api_lock
    with api_lock:
        s = get_session()
        data = request.get_json()
        s.delete_block(data["block_uuid"])
        result = { "result": "ok" }
        return json.dumps(result) + "\n"

@app.route("/api/edit_block", methods=['POST'])
def api_edit_block():
    global api_lock
    with api_lock:
        s = get_session()
        data = request.get_json()
        s.edit_block(data["block"])
        result = { "result": "ok" }
        return json.dumps(result) + "\n"

@app.route("/api/list_prompt_formats")
def api_glist_prompt_formats():
    global api_lock
    with api_lock:
        result = {"result": "ok", "prompt_formats": list_prompt_formats()}
        return json.dumps(result) + "\n"

@app.route("/api/generate", methods=['POST'])
def api_generate():
    global api_lock
    with api_lock:
        data = request.get_json()
        s = get_session()
        result = Response(stream_with_context(s.generate(data)), mimetype = 'application/json')
        return result

@app.route("/api/get_default_settings")
def api_get_default_settings():
    global api_lock
    with api_lock:
        result = { "result": "ok",
                   "settings": get_default_session_settings(),
                   "prompt_formats": list_prompt_formats() }
        return json.dumps(result) + "\n"

@app.route("/api/update_settings", methods=['POST'])
def api_update_settings():
    global api_lock
    with api_lock:
        s = get_session()
        data = request.get_json()
        s.update_settings(data["settings"])
        result = { "result": "ok" }
        return json.dumps(result) + "\n"

@app.route("/api/user_input", methods=['POST'])
def api_user_input():
    global api_lock
    with api_lock:
        s = get_session()
        data = request.get_json()
        new_block = s.user_input(data)
        result = { "result": "ok", "new_block": new_block }
        return json.dumps(result) + "\n"

@app.route("/api/list_sessions")
def api_list_sessions():
    global api_lock
    with api_lock:
        s, c = list_sessions()
        result = { "result": "ok", "sessions": s, "current_session": c }
        return json.dumps(result) + "\n"

@app.route("/api/new_session", methods=['POST'])
def api_new_session():
    global api_lock
    with api_lock:
        data = request.get_json()
        session = new_session()
        if "settings" in data: get_session().update_settings(data["settings"])
        if "new_name" in data: get_session().rename(data)
        result = { "result": "ok", "session": session }
        return json.dumps(result) + "\n"

@app.route("/api/rename_session", methods=['POST'])
def api_rename_session():
    global api_lock
    with api_lock:
        data = request.get_json()
        s = get_session()
        s.rename(data)
        result = { "result": "ok" }
        return json.dumps(result) + "\n"

@app.route("/api/delete_session", methods=['POST'])
def api_delete_session():
    global api_lock
    with api_lock:
        data = request.get_json()
        delete_session(data["session_uuid"]);
        result = { "result": "ok" }
        return json.dumps(result) + "\n"

@app.route("/api/set_session", methods=['POST'])
def api_set_session():
    global api_lock
    with api_lock:
        data = request.get_json()
        session = set_session(data)
        if session is not None:
            result = { "result": "ok",
                       "session": session,
                       "prompt_formats": list_prompt_formats() }
        else:
            result = { "result": "fail" }
        return json.dumps(result) + "\n"

@app.route("/api/list_models")
def api_list_models():
    global api_lock
    with api_lock:
        m, c = list_models()
        result = { "result": "ok", "models": m, "current_model": c }
        return json.dumps(result) + "\n"

@app.route("/api/update_model", methods=['POST'])
def api_update_model():
    global api_lock
    with api_lock:
        data = request.get_json()
        i = update_model(data)
        result = { "result": "ok", "new_model_uuid": i }
        return json.dumps(result) + "\n"

@app.route("/api/remove_model", methods=['POST'])
def api_remove_model():
    global api_lock
    with api_lock:
        data = request.get_json()
        remove_model(data)
        result = { "result": "ok" }
        return json.dumps(result) + "\n"

@app.route("/api/load_model", methods=['POST'])
def api_load_model():
    global api_lock
    with api_lock:
        data = request.get_json()
        result = Response(stream_with_context(load_model(data)), mimetype = 'application/json')
        return result

@app.route("/api/unload_model")
def api_unload_model():
    global api_lock
    with api_lock:
        result = unload_model()
        return json.dumps(result) + "\n"

@app.route("/api/get_model_info", methods=['POST'])
def api_get_model_info():
    global api_lock
    with api_lock:
        data = request.get_json()
        info = get_model_info(data)
        if info: result = { "result": "ok", "model_info": info }
        else: result = { "result": "fail" }
        return json.dumps(result) + "\n"

@app.route("/")
def home():
    global api_lock
    with api_lock:
        return render_template("index.html")

# Prepare torch

# torch.cuda._lazy_init()

# Prepare config

print(f" -- User dir: {args.dir}")

set_config_dir(args.dir)
global_state.load()
load_models()

# Start server

machine = args.host
host, port = machine.split(":")

if host == "localhost":
    Timer(1, lambda: webbrowser.open(f'http://{machine}/')).start()

serve(app, host = host, port = port)

