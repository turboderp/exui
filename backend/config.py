import sys, os, json

config_dir: str = "///"

def set_config_dir(config_dir_):
    global config_dir
    config_dir = os.path.expanduser(config_dir_)
    if not os.path.exists(config_dir):
        os.makedirs(config_dir)


def config_filename(filename: str):
    global config_dir
    return os.path.join(config_dir, filename)


class GlobalState:

    def __init__(self):
        pass

    def load(self):

        filename = config_filename("state.json")
        if os.path.exists(filename):
            with open(filename, "r") as f:
                r = json.load(f)
        else:
            r = {}


    def save(self):

        r = {}

        filename = config_filename("state.json")
        r_json = json.dumps(r, indent = 4)
        with open(filename, "w") as outfile:
            outfile.write(r_json)


global_state = GlobalState()