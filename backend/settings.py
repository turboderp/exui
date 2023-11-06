
import json
from backend.config import config_filename

def default_settings():
    j = {}
    j["smooth_scrolling"] = True
    j["show_stats"] = False
    j["theme"] = "Dark"
    return j

def get_settings():
    s_file = config_filename("settings.json")
    j = default_settings()
    try:
        with open(s_file, "r") as s:
            jl = json.load(s)
            j.update(jl)
    except FileNotFoundError:
        pass
    return j

def set_settings(data_settings):
    s_file = config_filename("settings.json")
    j = data_settings
    jd = json.dumps(j, indent = 4)
    with open(s_file, "w") as outfile:
        outfile.write(jd)
