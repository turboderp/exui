import json, uuid, os, gc, glob, time
import torch

from exllamav2 import (
    ExLlamaV2,
    ExLlamaV2Config,
    ExLlamaV2Cache,
    ExLlamaV2Cache_8bit,
    ExLlamaV2Tokenizer,
)
from exllamav2.generator import (
    ExLlamaV2StreamingGenerator,
    ExLlamaV2Sampler
)

from backend.config import set_config_dir, global_state, config_filename
from backend.models import get_loaded_model
from backend.prompts import prompt_formats
from backend.util import MultiTimer

notepad_list: dict or None = None
current_notepad = None

def list_notepads():
    global notepad_list

    if notepad_list is None:

        s_pattern = config_filename("notepad_*.json")
        s_files = glob.glob(s_pattern)
        s_files = sorted(s_files, key = os.path.getctime)

        notepad_list = {}

        for s_file in s_files:
            with open(s_file, "r") as s:
                j = json.load(s)
                i = j["notepad_uuid"]
                n = j["name"]
                notepad_list[i] = (n, s_file)

    sl = {}
    for k, v in notepad_list.items(): sl[k] = v[0]
    return sl, current_notepad.notepad_uuid if current_notepad is not None else None


# Notepad

def get_notepad():
    global current_notepad
    return current_notepad


def set_notepad(data):
    global current_notepad
    current_notepad = Notepad(data["notepad_uuid"])
    current_notepad.load()
    result = { "notepad": current_notepad.to_json() }
    if get_loaded_model():
        result["tokenized_text"] = current_notepad.get_tokenized_text()
    return result


def new_notepad():
    global current_notepad, notepad_list
    current_notepad = Notepad()
    current_notepad.init_new()
    print(f"Created notepad {current_notepad.notepad_uuid}")
    filename = current_notepad.save()
    notepad_list[current_notepad.notepad_uuid] = (current_notepad.name, filename)
    return current_notepad.to_json()


def delete_notepad(d_notepad):
    global current_notepad, notepad_list
    if d_notepad in notepad_list:
        filename = notepad_list[d_notepad][1]
        os.remove(filename)
        del notepad_list[d_notepad]
    if current_notepad is not None and current_notepad.notepad_uuid == d_notepad:
        current_notepad = None


def get_default_notepad_settings():
    return \
    {
        "maxtokens": 1024,
        "chunktokens": 512,
        "temperature": 0.8,
        "top_k": 50,
        "top_p": 0.8,
        "min_p": 0.0,
        "tfs": 0.0,
        "mirostat": False,
        "mirostat_tau": 1.25,
        "mirostat_eta": 0.1,
        "typical": 0.0,
        "repp": 1.15,
        "repr": 1024,
        "repd": 512
    }


class Notepad:

    name: str = None
    notepad_uuid: str = None
    text = ""
    settings: {} = None

    def __init__(self, notepad_uuid = None):
        self.notepad_uuid = notepad_uuid


    def filename(self):
        return config_filename("notepad_" + self.notepad_uuid + ".json")


    def init_new(self):
        self.name = "Unnamed notepad"
        self.notepad_uuid = str(uuid.uuid4())
        self.text = "Once upon a time,"
        self.settings = get_default_notepad_settings()


    def to_json(self):
        j = {}
        j["notepad_uuid"] = self.notepad_uuid
        j["name"] = self.name
        j["text"] = self.text
        j["settings"] = self.settings
        return j


    def from_json(self, j):
        self.name = j["name"]
        self.notepad_uuid = j["notepad_uuid"]
        self.text = j["text"]
        settings = get_default_notepad_settings()
        if "settings" in j: settings.update(j["settings"])
        self.settings = settings


    def rename(self, data):
        global notepad_list

        if "notepad_uuid" in data:
            assert data["notepad_uuid"] == self.notepad_uuid

        notepad_list[self.notepad_uuid] = (data["new_name"], notepad_list[self.notepad_uuid][1])
        self.name = data["new_name"]
        self.save()


    def save(self):
        print(f"Saving notepad: {self.filename()}")
        jd = json.dumps(self.to_json(), indent = 4)
        with open(self.filename(), "w") as outfile:
            outfile.write(jd)
        return self.filename()


    def load(self):
        print(f"Loading notepad: {self.filename()}")
        with open(self.filename(), "r") as s:
            j = json.load(s)
        self.from_json(j)


    def update_settings(self, settings):
        self.settings = settings
        self.save()


    def set_text(self, text):
        self.text = text
        self.save()


    def get_tokenized_text(self):
        m = get_loaded_model()
        if not m: return None
        tokens = m.tokenizer.encode(self.text, encode_special_tokens = True)[0].tolist()
        id_to_piece = m.tokenizer.get_id_to_piece_list()
        tokenized = []
        for token in tokens:
            t = {}
            t["id"] = token
            t["piece"] = m.tokenizer.extended_id_to_piece.get(token, id_to_piece[token])
            tokenized.append(t)
        return tokenized