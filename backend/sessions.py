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
from exllamav2.generator.filters import (
    ExLlamaV2SelectFilter
)

from backend.config import set_config_dir, global_state, config_filename
from backend.models import get_loaded_model
from backend.prompts import prompt_formats
from backend.util import MultiTimer

session_list: dict or None = None
current_session = None

# Cancel

cancel_signal = False
def set_cancel_signal():
    global cancel_signal
    cancel_signal = True


# List models

def list_sessions():
    global session_list

    if session_list is None:

        s_pattern = config_filename("session_*.json")
        s_files = glob.glob(s_pattern)
        s_files = sorted(s_files, key = os.path.getctime)

        session_list = {}

        for s_file in s_files:
            with open(s_file, "r") as s:
                j = json.load(s)
                i = j["session_uuid"]
                n = j["name"]
                session_list[i] = (n, s_file)

    sl = {}
    for k, v in session_list.items(): sl[k] = v[0]
    return sl, current_session.session_uuid if current_session is not None else None


# Session

def get_session():
    global current_session
    return current_session


def set_session(data):
    global current_session
    current_session = Session(data["session_uuid"])
    current_session.load()
    return current_session.to_json()


def new_session():
    global current_session, session_list
    current_session = Session()
    current_session.init_new()
    print(f"Created session {current_session.session_uuid}")
    filename = current_session.save()
    session_list[current_session.session_uuid] = (current_session.name, filename)
    return current_session.to_json()


def delete_session(d_session):
    global current_session, session_list
    if d_session in session_list:
        filename = session_list[d_session][1]
        os.remove(filename)
        del session_list[d_session]
    if current_session is not None and current_session.session_uuid == d_session:
        current_session = None


def get_default_session_settings():
    return \
    {
        "prompt_format": "Chat-RP",
        "roles": [ "User", "Assistant", "", "", "", "", "", "" ],
        "system_prompt_default": True,
        "system_prompt": "This is a chat between a curious user and a helpful AI assistant.",
        "maxtokens": 1024,
        "chunktokens": 512,
        "stop_newline": False,
        "temperature": 0.8,
        "top_k": 50,
        "top_p": 0.8,
        "min_p": 0.0,
        "tfs": 0.0,
        "mirostat": False,
        "mirostat_tau": 1.25,
        "mirostat_eta": 0.1,
        "typical": 0.0,
        "repp": 1.01,
        "repr": 1024,
        "repd": 512,
        "quad_sampling": 0.0,
        "temperature_last": False,
        "skew": 0.0,
    }

class Session:

    name: str = None
    session_uuid: str = None
    history: [] = None
    settings: {} = None
    # mode: str

    history_first = 0

    def __init__(self, session_uuid = None):
        self.session_uuid = session_uuid


    def filename(self):
        return config_filename("session_" + self.session_uuid + ".json")


    def init_new(self):
        self.name = "Unnamed session"
        self.session_uuid = str(uuid.uuid4())
        self.history = []
        # self.mode = ""
        self.settings = get_default_session_settings()


    def to_json(self):
        j = {}
        j["session_uuid"] = self.session_uuid
        j["name"] = self.name
        j["history"] = self.history
        # j["mode"] = self.mode
        j["settings"] = self.settings
        return j


    def from_json(self, j):
        self.name = j["name"]
        self.session_uuid = j["session_uuid"]
        self.history = j["history"]
        # self.mode = j["mode"]
        settings = get_default_session_settings()
        if "settings" in j: settings.update(j["settings"])
        self.settings = settings


    def load(self):
        # print(f"Loading session: {self.filename()}")
        with open(self.filename(), "r") as s:
            j = json.load(s)
        self.from_json(j)


    def save(self):
        # print(f"Saving session: {self.filename()}")
        jd = json.dumps(self.to_json(), indent = 4)
        with open(self.filename(), "w") as outfile:
            outfile.write(jd)
        return self.filename()


    def update_settings(self, settings):
        self.settings = settings
        self.save()


    def user_input(self, data):
        prompt_format = prompt_formats[self.settings["prompt_format"]]()
        input_text = data["user_input_text"]
        new_block = {}
        new_block["block_uuid"] = str(uuid.uuid4())
        new_block["author"] = "user"
        if prompt_format.is_instruct(): prefix = ""
        else: prefix = self.settings["roles"][0] + ": "
        new_block["text"] = prefix + input_text
        self.history.append(new_block)
        self.save()
        return new_block


    def create_context(self, prompt_format, max_len, min_len, prefix = ""):

        if prompt_format.is_instruct():
            return self.create_context_instruct(prompt_format, max_len, min_len, prefix)
        else:
            return self.create_context_raw(prompt_format, max_len, min_len, prefix)


    def create_context_instruct(self, prompt_format, max_len, min_len, prefix = ""):

        tokenizer = get_loaded_model().tokenizer
        prompts = []
        responses = []

        # Create prompt-response pairs, pad in case of multiple prompts or responses in a row

        for h in self.history:

            if h["author"] == "assistant":
                if len(prompts) == len(responses): prompts.append("")
                responses.append(h["text"])

            elif h["author"] == "user":
                if len(prompts) != len(responses): responses.append("")
                prompts.append(h["text"])

            else:
                print("Unknown author")

        # Get relative length of system prompt

        p1 = prompt_format.format("", None, None, self.settings)
        p2 = prompt_format.format("", "", self.settings["system_prompt"], self.settings)
        t1 = tokenizer.encode(p1, encode_special_tokens = prompt_format.encode_special_tokens())
        t2 = tokenizer.encode(p2, encode_special_tokens = prompt_format.encode_special_tokens())
        system_length = t2.shape[-1] - t1.shape[-1]

        # Format and tokenize prompt-response pairs without system prompt

        pairs = []
        tokenized_pairs = []
        for turn in range(len(prompts)):
            p = prompts[turn]
            r = responses[turn] if turn < len(responses) else None
            pair = prompt_format.format(p, r, None, self.settings)
            pairs.append(pair)
            tokenized_pairs.append(tokenizer.encode(pair, encode_special_tokens = prompt_format.encode_special_tokens()))
        lengths = [tp.shape[-1] for tp in tokenized_pairs]

        # Advance or roll back history

        current_length = system_length + sum(lengths[self.history_first:])

        if current_length > max_len:
            target_max = min_len
            while current_length > target_max and self.history_first < len(prompts) - 1:
                current_length -= lengths[self.history_first]
                self.history_first += 1

        while current_length < min_len and self.history_first > 0:
            if current_length + lengths[self.history_first - 1] > max_len: break
            self.history_first -= 1
            current_length += lengths[self.history_first]

        # Reinsert system prompt at new first position

        p = prompts[self.history_first]
        r = responses[self.history_first] if self.history_first < len(responses) else None
        pair = prompt_format.format(p, r, self.settings["system_prompt"], self.settings)
        pairs[self.history_first] = pair
        tokenized_pairs[self.history_first] = tokenizer.encode(pair, encode_special_tokens = prompt_format.encode_special_tokens())

        # Create context

        context_str = "".join(pairs[self.history_first:])
        context_ids = torch.cat(tokenized_pairs[self.history_first:], dim = -1)

        # print("self.history_first", self.history_first)
        # print("context_ids.shape[-1]", context_ids.shape[-1])
        return context_str, context_ids


    def create_context_raw(self, prompt_format, max_len, min_len, prefix=""):

        tokenizer = get_loaded_model().tokenizer
        history_copy = [h["text"] for h in self.history]

        # Get length of system prompt

        if self.settings["system_prompt"] and self.settings["system_prompt"].strip() != "":
            system_prompt = self.settings["system_prompt"] + "\n"
            system_prompt_tokenized = tokenizer.encode(system_prompt, encode_special_tokens = prompt_format.encode_special_tokens())
            system_length = system_prompt_tokenized.shape[-1]
        else:
            system_prompt = ""
            system_prompt_tokenized = torch.empty((1, 0), dtype = torch.long)
            system_length = 0

        # Format and tokenize block without system prompt

        blocks = []
        tokenized_blocks = []
        for turn in range(len(history_copy)):
            block = history_copy[turn] + "\n"
            blocks.append(block)
            tokenized_blocks.append(tokenizer.encode(block, encode_special_tokens = prompt_format.encode_special_tokens()))
        if prefix != "":
            block = prefix
            blocks.append(block)
            tokenized_blocks.append(tokenizer.encode(block, encode_special_tokens = prompt_format.encode_special_tokens()))

        lengths = [tp.shape[-1] for tp in tokenized_blocks]

        # Advance or roll back history

        current_length = system_length + sum(lengths[self.history_first:])

        if current_length > max_len:
            target_max = min_len
            while current_length > target_max and self.history_first < len(history_copy) - 1:
                current_length -= lengths[self.history_first]
                self.history_first += 1

        while current_length < min_len and self.history_first > 0:
            if current_length + lengths[self.history_first - 1] > max_len: break
            self.history_first -= 1
            current_length += lengths[self.history_first]

        # Create context

        context_str = system_prompt + "".join(blocks[self.history_first:])
        context_ids = torch.cat([system_prompt_tokenized] + tokenized_blocks[self.history_first:], dim = -1)

        # print("self.history_first", self.history_first)
        # print("context_ids.shape[-1]", context_ids.shape[-1])
        return context_str, context_ids


    def generate(self, data):
        global cancel_signal

        mt = MultiTimer()

        if get_loaded_model() is None:
            packet = { "result": "fail", "error": "No model loaded." }
            yield json.dumps(packet) + "\n"
            return packet

        model = get_loaded_model().model
        generator = get_loaded_model().generator
        tokenizer = get_loaded_model().tokenizer
        cache = get_loaded_model().cache

        prompt_format = prompt_formats[self.settings["prompt_format"]]()

        # Create response block

        if prompt_format.is_instruct():

            new_block = {}
            new_block["block_uuid"] = str(uuid.uuid4())
            new_block["author"] = "assistant"
            new_block["text"] = ""

            packet = {}
            packet["result"] = "begin_block"
            packet["block"] = new_block
            yield json.dumps(packet) + "\n"

        # Sampling settings

        gen_settings = ExLlamaV2Sampler.Settings()
        gen_settings.temperature = self.settings["temperature"]
        gen_settings.temperature_last = self.settings["temperature_last"]
        gen_settings.top_k = self.settings["top_k"]
        gen_settings.top_p = self.settings["top_p"]
        gen_settings.min_p = self.settings["min_p"]
        gen_settings.smoothing_factor = self.settings["quad_sampling"]
        gen_settings.tfs = self.settings["tfs"]
        gen_settings.typical = self.settings["typical"]
        gen_settings.mirostat = self.settings["mirostat"]
        gen_settings.mirostat_tau = self.settings["mirostat_tau"]
        gen_settings.mirostat_eta = self.settings["mirostat_eta"]
        gen_settings.skew = self.settings["skew"]
        gen_settings.token_repetition_penalty = self.settings["repp"]
        gen_settings.token_repetition_range = self.settings["repr"]
        gen_settings.token_repetition_decay = self.settings["repr"]

        if gen_settings.temperature == 0:
            gen_settings.temperature = 1.0
            gen_settings.top_k = 1
            gen_settings.top_p = 0
            gen_settings.typical = 0

        if prompt_format.is_instruct():
            generator.set_stop_conditions(prompt_format.stop_conditions(tokenizer, self.settings))
        else:
            if self.settings["stop_newline"]:
                generator.set_stop_conditions(["\n"])
            else:
                stop = set()
                for r in self.settings["roles"]:
                    if r.strip() != "":
                        stop.add("\n" + r + ":")
                        stop.add("\n " + r + ":")
                        stop.add("\n" + r.upper() + ":")
                        stop.add("\n " + r.upper() + ":")
                        stop.add("\n" + r.lower() + ":")
                        stop.add("\n " + r.lower() + ":")
                generator.set_stop_conditions(list(stop) + [tokenizer.eos_token_id])

        # Begin response

        generated_tokens = 0
        max_new_tokens = self.settings["maxtokens"]
        chunk_tokens = 0

        last_chunk_time = time.time()
        full_response = ""  # TODO: Preload response
        save_tokens = torch.empty((1, 0), dtype = torch.long)
        chunk_buffer = ""

        chunk_size = self.settings["chunktokens"]

        # If not in instruct mode, generate bot name prefix

        prefix = ""
        if not prompt_format.is_instruct():

            bot_roles = []
            for r in self.settings["roles"][1:]:
                if r.strip() != "": bot_roles.append(r + ":")
            assert len(bot_roles) >= 1

            past_tokens = model.config.max_seq_len - chunk_size - save_tokens.shape[-1]
            past_tokens_min = model.config.max_seq_len - 2 * chunk_size - save_tokens.shape[-1]
            context_str, context_ids = self.create_context(prompt_format, past_tokens, past_tokens_min)
            gen_settings.filters = [ExLlamaV2SelectFilter(model, tokenizer, bot_roles, case_insensitive = False)]

            mt.set_stage("prompt")
            generator.begin_stream(context_ids, gen_settings, token_healing = False)
            mt.stop()

            mt.set_stage("gen")
            while True:
                chunk, eos, tokens = generator.stream()
                prefix += chunk
                if eos: break
            mt.stop()

            gen_settings.filters = []

            # Begin block with bot name prefix

            new_block = {}
            new_block["block_uuid"] = str(uuid.uuid4())
            new_block["author"] = "assistant"
            new_block["text"] = prefix

            packet = {}
            packet["result"] = "begin_block"
            packet["block"] = new_block
            yield json.dumps(packet) + "\n"

        # Stream response

        cancel_signal = False

        mt.set_stage("gen")
        while True:

            if cancel_signal:
                break

            if chunk_tokens == 0:

                packet = {}
                packet["result"] = "prompt_eval"
                packet["block_uuid"] = new_block["block_uuid"]
                yield json.dumps(packet) + "\n"

                past_tokens = model.config.max_seq_len - chunk_size - save_tokens.shape[-1]
                past_tokens_min = model.config.max_seq_len - 2 * chunk_size - save_tokens.shape[-1]
                context_str, context_ids = self.create_context(prompt_format, past_tokens, past_tokens_min, prefix)
                context_ids = torch.cat((context_ids, save_tokens), dim = -1)

                mt.set_stage("prompt")
                generator.begin_stream(context_ids, gen_settings, token_healing = False)
                chunk_tokens = model.config.max_seq_len - context_ids.shape[-1] - 1
                mt.set_stage("gen")

            chunk, eos, tokens = generator.stream()
            save_tokens = torch.cat((save_tokens, tokens), dim = -1)

            generated_tokens += 1
            chunk_tokens -= 1

            chunk_buffer += chunk

            now = time.time()
            elapsed = now - last_chunk_time

            if chunk_buffer != "" and (elapsed > 0.05 or eos or generated_tokens == max_new_tokens):

                packet = {}
                packet["result"] = "stream_to_block"
                packet["block_uuid"] = new_block["block_uuid"]
                packet["text"] = chunk_buffer
                yield json.dumps(packet) + "\n"

                full_response += chunk_buffer
                chunk_buffer = ""
                last_chunk_time = now

            if eos or generated_tokens == max_new_tokens: break

        # Compile metadata

        mt.stop()
        meta = {}
        meta["prompt_tokens"] = context_ids.shape[-1]
        meta["prompt_speed"] = context_ids.shape[-1] / (mt.stages["prompt"] + 1e-8)
        meta["gen_tokens"] = generated_tokens
        meta["gen_speed"] = generated_tokens / (mt.stages["gen"] + 1e-8)
        meta["overflow"] = max_new_tokens if generated_tokens == max_new_tokens else 0
        meta["canceled"] = cancel_signal
        new_block["meta"] = meta

        # Save response block

        new_block["text"] = prefix + full_response.rstrip()
        self.history.append(new_block)
        self.save()

        # Done

        packet = { "result": "ok", "new_block": new_block }
        yield json.dumps(packet) + "\n"

        return packet


    def rename(self, data):
        global session_list

        if "session_uuid" in data:
            assert data["session_uuid"] == self.session_uuid

        session_list[self.session_uuid] = (data["new_name"], session_list[self.session_uuid][1])
        self.name = data["new_name"]
        self.save()


    def delete_block(self, block_uuid):

        print(f"Deleting block: {block_uuid}")

        for h in self.history:
            if h["block_uuid"] == block_uuid:
                self.history.remove(h)
                break
        self.save()


    def edit_block(self, block):

        block_uuid = block['block_uuid']
        print(f"Editing block: {block_uuid}")

        for i in range(len(self.history)):
            if self.history[i]["block_uuid"] == block_uuid:
                self.history[i] = block
                break
        self.save()

