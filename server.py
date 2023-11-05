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
from backend.settings import get_settings, set_settings

app = Flask("ExUI")
app.static_folder = 'static'
api_lock = Lock()

parser = argparse.ArgumentParser(description="ExUI, chatbot UI for ExLlamaV2")
parser.add_argument("-host", "--host", type = str, help = "IP:PORT eg, 0.0.0.0:5000", default = "localhost:5000")
parser.add_argument("-d", "--dir", type = str, help = "Location for user data and sessions, default: ~/exui", default = "~/exui")
args = parser.parse_args()

@app.route("/")
def home():
    # global api_lock
    print("/")
    # with api_lock:
    return render_template("index.html")

@app.route("/api/list_models")
def api_list_models():
    global api_lock
    print("/api/list_models")
    with api_lock:
        m, c = list_models()
        result = { "result": "ok",
                   "models": m,
                   "current_model": c }
        print("->", result)
        return json.dumps(result) + "\n"

@app.route("/api/get_model_info", methods=['POST'])
def api_get_model_info():
    global api_lock
    print("/api/get_model_info")
    with api_lock:
        data = request.get_json()
        print("<-", data)
        info = get_model_info(data)
        if info: result = { "result": "ok",
                            "model_info": info }
        else: result = { "result": "fail" }
        print("->", result)
        return json.dumps(result) + "\n"

@app.route("/api/update_model", methods=['POST'])
def api_update_model():
    global api_lock
    print("/api/update_model")
    with api_lock:
        data = request.get_json()
        print("<-", data)
        i = update_model(data["model_info"])
        result = { "result": "ok", "new_model_uuid": i }
        print("->", result)
        return json.dumps(result) + "\n"

@app.route("/api/load_model", methods=['POST'])
def api_load_model():
    global api_lock
    print("/api/load_model")
    with api_lock:
        data = request.get_json()
        print("<-", data)
        print("-> ...")
        result = Response(stream_with_context(load_model(data)), mimetype = 'application/json')
        print("->", result)
        return result

@app.route("/api/unload_model")
def api_unload_model():
    global api_lock
    print("/api/unload_model")
    with api_lock:
        result = unload_model()
        print("->", result)
        return json.dumps(result) + "\n"

@app.route("/api/list_sessions")
def api_list_sessions():
    global api_lock
    print("/api/list_sessions")
    with api_lock:
        s, c = list_sessions()
        result = { "result": "ok", "sessions": s, "current_session": c }
        print("-> (...)")
        return json.dumps(result) + "\n"

@app.route("/api/get_default_settings")
def api_get_default_settings():
    global api_lock
    print("/api/get_default_settings")
    with api_lock:
        result = { "result": "ok",
                   "settings": get_default_session_settings(),
                   "prompt_formats": list_prompt_formats() }
        return json.dumps(result) + "\n"

@app.route("/api/set_session", methods=['POST'])
def api_set_session():
    global api_lock
    print("/api/set_session")
    with api_lock:
        data = request.get_json()
        print("<-", data)
        session = set_session(data)
        if session is not None:
            result = { "result": "ok",
                       "session": session,
                       "prompt_formats": list_prompt_formats() }
            print("-> (...)")
        else:
            result = { "result": "fail" }
            print("->", result)
        return json.dumps(result) + "\n"

@app.route("/api/new_session", methods=['POST'])
def api_new_session():
    global api_lock
    print("/api/new_session")
    with api_lock:
        data = request.get_json()
        print("<-", data)
        session = new_session()
        if "settings" in data: get_session().update_settings(data["settings"])
        if "user_input_text" in data: get_session().user_input(data)
        if "new_name" in data: get_session().rename(data)
        result = { "result": "ok", "session": session }
        print("-> (...)")
        return json.dumps(result) + "\n"

@app.route("/api/rename_session", methods=['POST'])
def api_rename_session():
    global api_lock
    print("/api/rename_session")
    with api_lock:
        data = request.get_json()
        print("<-", data)
        s = get_session()
        s.rename(data)
        result = { "result": "ok" }
        print("->", result)
        return json.dumps(result) + "\n"

@app.route("/api/update_settings", methods=['POST'])
def api_update_settings():
    global api_lock
    print("/api/update_settings")
    with api_lock:
        s = get_session()
        data = request.get_json()
        print("<-", data)
        s.update_settings(data["settings"])
        result = { "result": "ok" }
        print("->", result)
        return json.dumps(result) + "\n"

@app.route("/api/user_input", methods=['POST'])
def api_user_input():
    global api_lock
    print("/api/user_input")
    with api_lock:
        s = get_session()
        data = request.get_json()
        print("<-", data)
        new_block = s.user_input(data)
        result = { "result": "ok", "new_block": new_block }
        print("->", result)
        return json.dumps(result) + "\n"

@app.route("/api/list_prompt_formats")
def api_list_prompt_formats():
    global api_lock
    print("/api/list_prompt_formats")
    with api_lock:
        result = {"result": "ok", "prompt_formats": list_prompt_formats()}
        print("->", result)
        return json.dumps(result) + "\n"

@app.route("/api/delete_block", methods=['POST'])
def api_delete_block():
    global api_lock
    print("/api/delete_block")
    with api_lock:
        s = get_session()
        data = request.get_json()
        print("<-", data)
        s.delete_block(data["block_uuid"])
        result = { "result": "ok" }
        print("->", result)
        return json.dumps(result) + "\n"

@app.route("/api/edit_block", methods=['POST'])
def api_edit_block():
    global api_lock
    print("/api/edit_block")
    with api_lock:
        s = get_session()
        data = request.get_json()
        print("<-", data)
        s.edit_block(data["block"])
        result = { "result": "ok" }
        print("->", result)
        return json.dumps(result) + "\n"

@app.route("/api/generate", methods=['POST'])
def api_generate():
    global api_lock
    print("/api/generate")
    with api_lock:
        data = request.get_json()
        print("<-", data)
        s = get_session()
        print("-> ...");
        result = Response(stream_with_context(s.generate(data)), mimetype = 'application/json')
        print("->", result)
        return result

@app.route("/api/delete_session", methods=['POST'])
def api_delete_session():
    global api_lock
    print("/api/delete_session")
    with api_lock:
        data = request.get_json()
        print("<-", data)
        delete_session(data["session_uuid"]);
        result = { "result": "ok" }
        print("->", result)
        return json.dumps(result) + "\n"

@app.route("/api/remove_model", methods=['POST'])
def api_remove_model():
    global api_lock
    print("/api/remove_model")
    with api_lock:
        data = request.get_json()
        print("<-", data)
        remove_model(data)
        result = { "result": "ok" }
        print("->", result)
        return json.dumps(result) + "\n"

@app.route("/api/get_settings")
def api_get_settings():
    global api_lock
    print("/api/get_settings")
    with api_lock:
        settings = get_settings()
        result = { "result": "ok",
                   "settings": settings }
        print("->", result)
        return json.dumps(result) + "\n"

@app.route("/api/set_settings", methods=['POST'])
def api_set_settings():
    global api_lock
    print("/api/set_settings")
    with api_lock:
        data = request.get_json()
        print("<-", data)
        set_settings(data["settings"])
        result = { "result": "ok" }
        print("->", result)
        return json.dumps(result) + "\n"

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

serve(app, host = host, port = port, threads = 8)

