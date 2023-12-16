import json, uuid, os, gc
import torch
from pynvml import *

from exllamav2 import(
    ExLlamaV2,
    ExLlamaV2Config,
    ExLlamaV2Cache,
    ExLlamaV2Cache_8bit,
    ExLlamaV2Tokenizer,
)

from exllamav2.generator import(
    ExLlamaV2StreamingGenerator,
    ExLlamaV2Sampler
)

from exllamav2.attn import ExLlamaV2Attention
# from exllamav2.util import list_live_tensors
from backend.config import config_filename
from backend.util import *

auto_split_reserve_bytes = 512 * 1024**2

models = {}

# Load/save config

def load_models():
    global models

    filename = config_filename("models.json")
    if os.path.exists(filename):
        with open(filename, "r") as f:
            models = json.load(f)
    else:
        models = {}


def save_models():
    global models

    filename = config_filename("models.json")
    models_json = json.dumps(models, indent = 4)
    with open(filename, "w") as outfile:
        outfile.write(models_json)


# List models

def list_models():
    global models

    models_list = {}
    for k, v in models.items(): models_list[k] = v["name"]
    current_model = loaded_model.get_uuid() if loaded_model is not None else None
    return models_list, current_model


# Get model

def get_model_info(data = None):
    global models

    if data is None: return None

    i = data["model_uuid"]
    if i is None: return None
    return models[i]


# Remove model config

def remove_model(data):
    global models

    i = data["model_uuid"]
    if i is None: return

    del models[i]
    save_models()


# Update model config

def update_model(data):
    global models

    # print(data)

    if data["model_uuid"] is None or data["model_uuid"] == "new":
        new_model = {}
        i = str(uuid.uuid4())
        new_model["model_uuid"] = i
        new_model["name"] = data.get("name", "Unnamed model")
        new_model["model_directory"] = data.get("model_directory", "")
        models[i] = new_model
        prepare_model(new_model)
        save_models()
        return i

    i = data["model_uuid"]
    model = models[i]

    prev_model = model.copy()
    for k, v in data.items(): model[k] = v

    if model["model_directory"] != prev_model["model_directory"]:
        prepare_model(model)
    if model.get("draft_model_directory", "") != prev_model.get("draft_model_directory", "") \
        or model.get("draft_enabled", "") != prev_model.get("draft_enabled", ""):
        prepare_draft_model(model)

    save_models()
    return None


def prepare_draft_model(model):

    if "draft_enabled" not in model: model["draft_enabled"] = False
    if model["draft_enabled"]:

        prep_draft_config = ExLlamaV2Config()
        prep_draft_config.model_dir = expanduser(model.get("draft_model_directory", ""))
        try:
            prep_draft_config.prepare()
            model["draft_config_status"] = "ok"
            model["draft_config_status_error"] = None
        except Exception as e:
            model["draft_config_status"] = "error"
            model["draft_config_status_error"] = str(e)
            return

        draft_stats = {}
        draft_stats["hidden_size"] = prep_draft_config.hidden_size
        draft_stats["intermediate_size"] = prep_draft_config.intermediate_size
        draft_stats["num_attention_heads"] = prep_draft_config.num_attention_heads
        draft_stats["num_key_value_heads"] = prep_draft_config.num_key_value_heads
        draft_stats["num_hidden_layers"] = prep_draft_config.num_hidden_layers
        draft_stats["vocab_size"] = prep_draft_config.vocab_size
        draft_stats["head_dim"] = prep_draft_config.head_dim
        draft_stats["default_seq_len"] = prep_draft_config.max_seq_len
        model["draft_stats"] = draft_stats

        if "draft_rope_alpha" not in model: model["draft_rope_alpha"] = 1.0
        if "draft_rope_alpha_auto" not in model: model["draft_rope_alpha_auto"] = True


def prepare_model(model):

    prep_config = ExLlamaV2Config()
    prep_config.model_dir = expanduser(model["model_directory"])

    try:
        prep_config.prepare()
        model["config_status"] = "ok"
        model["config_status_error"] = None
    except Exception as e:
        model["config_status"] = "error"
        model["config_status_error"] = str(e)
        return

    stats = {}
    stats["hidden_size"] = prep_config.hidden_size
    stats["intermediate_size"] = prep_config.intermediate_size
    stats["num_attention_heads"] = prep_config.num_attention_heads
    stats["num_key_value_heads"] = prep_config.num_key_value_heads
    stats["num_hidden_layers"] = prep_config.num_hidden_layers
    stats["vocab_size"] = prep_config.vocab_size
    stats["head_dim"] = prep_config.head_dim
    stats["default_seq_len"] = prep_config.max_seq_len
    model["stats"] = stats

    model["default_seq_len"] = prep_config.max_seq_len
    if "seq_len" not in model: model["seq_len"] = prep_config.max_seq_len
    if "rope_scale" not in model: model["rope_scale"] = prep_config.scale_pos_emb
    if "rope_alpha" not in model: model["rope_alpha"] = prep_config.scale_alpha_value

    if "cache_mode" not in model: model["cache_mode"] = "FP16"
    if "chunk_size" not in model: model["chunk_size"] = prep_config.max_input_len
    if "gpu_split" not in model: model["gpu_split"] = ""
    if "gpu_split_auto" not in model: model["gpu_split_auto"] = True


class ModelContainer:

    config: ExLlamaV2Config or None = None
    draft_config: ExLlamaV2Config or None = None
    model: ExLlamaV2 or None = None
    draft_model: ExLlamaV2 or None = None
    cache: ExLlamaV2Cache or None = None
    draft_cache: ExLlamaV2Cache or None = None
    tokenizer: ExLlamaV2Tokenizer or None = None
    generator: ExLlamaV2StreamingGenerator or None = None
    model_dict = None

    cache_fp8: bool = False
    draft_enabled: bool = False

    def __init__(self, model, progress_callback = None):

        self.model_dict = model

        self.config = ExLlamaV2Config()
        self.config.model_dir = expanduser(model["model_directory"])
        self.config.prepare()

        self.config.max_seq_len = model["seq_len"]
        self.config.scale_pos_emb = model["rope_scale"]
        self.config.scale_alpha_value = model["rope_alpha"]
        self.config.max_input_len = model["chunk_size"]
        self.config.max_attn_size = model["chunk_size"] ** 2

        self.draft_enabled = self.model_dict["draft_enabled"] if "draft_enabled" in self.model_dict else False

        if self.draft_enabled:

            self.draft_config = ExLlamaV2Config()
            self.draft_config.model_dir = expanduser(model["draft_model_directory"])
            self.draft_config.prepare()

            alpha = model["draft_rope_alpha"]
            if model["draft_rope_alpha_auto"]:
                ratio = self.config.max_seq_len / self.draft_config.max_seq_len
                alpha = -0.13436 + 0.80541 * ratio + 0.28833 * ratio ** 2
                print(f" -- Applying draft model auto RoPE alpha = {alpha:.4f}")

            self.draft_config.max_seq_len = self.config.max_seq_len

            self.draft_config.scale_alpha_value = alpha
            self.draft_config.scale_pos_emb = model["rope_scale"]
            self.draft_config.max_input_len = model["chunk_size"]
            self.draft_config.max_attn_size = model["chunk_size"] ** 2


    def load(self, progress_callback = None):

        if self.model_dict["cache_mode"] == "FP8": self.cache_fp8 = True
        elif self.model_dict["cache_mode"] == "FP16": self.cache_fp8 = False
        else: raise ValueError("bad cache_mode: " + self.model_dict["cache_mode"])

        self.tokenizer = ExLlamaV2Tokenizer(self.config)

        # Load draft model

        if self.draft_enabled:

            self.draft_model = ExLlamaV2(self.draft_config)
            print("Loading draft model: " + self.draft_config.model_dir)

            self.draft_cache = ExLlamaV2Cache(self.draft_model, lazy = True)
            reserve = [96 * 1024**2] + [0] * 16
            yield from self.draft_model.load_autosplit_gen(self.draft_cache, reserve_vram = reserve, last_id_only = True, callback_gen = progress_callback)

            # Test VRAM allocation with a full-length forward pass

            input_ids = torch.zeros((1, self.config.max_input_len), dtype = torch.long)
            self.draft_model.forward(input_ids, cache = self.cache, preprocess_only = True)

        # Load model

        self.model = ExLlamaV2(self.config)
        print("Loading model: " + self.config.model_dir)

        if self.model_dict["gpu_split_auto"]:
            auto_split = True
        elif self.model_dict["gpu_split"] is None or self.model_dict["gpu_split"].strip() == "":
            auto_split = False
            split = None
        else:
            auto_split = False
            split = [float(alloc) for alloc in self.model_dict["gpu_split"].split(",")]

        if not auto_split:
            for value in self.model.load_gen(split, callback_gen = progress_callback):
                if isinstance(value, str):
                    yield value

        if self.cache_fp8:
            self.cache = ExLlamaV2Cache_8bit(self.model, lazy = auto_split)
        else:
            self.cache = ExLlamaV2Cache(self.model, lazy = auto_split)

        if auto_split:
            reserve = [96 * 1024**2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            yield from self.model.load_autosplit_gen(self.cache, reserve_vram = reserve, last_id_only = True, callback_gen = progress_callback)

        # Test VRAM allocation with a full-length forward pass

        input_ids = torch.zeros((1, self.config.max_input_len), dtype = torch.long)
        self.model.forward(input_ids, cache = self.cache, preprocess_only = True)

        # Create generator

        self.generator = ExLlamaV2StreamingGenerator(self.model, self.cache, self.tokenizer, self.draft_model, self.draft_cache)


    def get_free_vram(self):
        global auto_split_reserve_bytes

        nvmlInit()
        device_count = torch.cuda.device_count()
        free_vram = []
        for i in range(device_count):
            handle = nvmlDeviceGetHandleByIndex(i)
            info = nvmlDeviceGetMemoryInfo(handle)
            free_vram.append(info.free - auto_split_reserve_bytes)

        return free_vram


    def get_uuid(self):

        return self.model_dict["model_uuid"]


    def unload(self):

        if self.model: self.model.unload()
        self.model = None
        self.config = None
        self.cache = None
        self.tokenizer = None


def stream_progress(module, num_modules):

    packet = \
    {
        "result": "progress",
        "module": module ,
        "num_modules": num_modules
    }
    # print(json.dumps(packet))
    yield json.dumps(packet) + "\n"


loaded_model: ModelContainer or None = None

def get_loaded_model():
    return loaded_model


def load_model(data):
    global models, loaded_model

    if loaded_model is not None:
        loaded_model.unload()
        loaded_model = None

    gc.collect()
    torch.cuda.empty_cache()

    i = data["model_uuid"]
    model = models[i]

    try:
        loaded_model = ModelContainer(model)
        yield from loaded_model.load(progress_callback = stream_progress)
        success = True
    except Exception as e:
        loaded_model = None
        errormsg = type(e).__name__ + ":\n"
        errormsg += str(e)
        success = False

    if not success:
        gc.collect()
        torch.cuda.empty_cache()
        result = { "result": "fail", "error": errormsg }
        # print(json.dumps(result) + "\n")
        yield json.dumps(result) + "\n"
        return ""

    result = { "result": "ok" }
    # print(json.dumps(result) + "\n")
    yield json.dumps(result) + "\n"


def unload_model():
    global loaded_model

    if loaded_model is not None:
        loaded_model.unload()
        loaded_model = None

    gc.collect()
    torch.cuda.empty_cache()

    result = { "result": "ok" }
    return result

