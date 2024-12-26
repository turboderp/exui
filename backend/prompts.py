
class PromptFormat:

    def __init__(self):
        pass

    def format(self, prompt, response, system_prompt, settings):
        raise NotImplementedError

    def stop_conditions(self, tokenizer, settings):
        raise NotImplementedError

    def is_instruct(self):
        raise NotImplementedError

    def encode_special_tokens(self):
        return True

    def context_bos(self):
        return False

    @staticmethod
    def supports_system_prompt():
        return True


class PromptFormat_raw(PromptFormat):

    description = "Model-agnostic mode simulating a raw chatlog between two or more users"

    def __init__(self):
        super().__init__()
        pass

    def is_instruct(self):
        return False

    def stop_conditions(self, tokenizer, settings):
        raise NotImplementedError

    def format(self, prompt, response, system_prompt, settings):
        raise NotImplementedError

    def encode_special_tokens(self):
        return True


class PromptFormat_llama(PromptFormat):

    description = "Llama-chat, Llama2-chat and Mistral-instruct models"

    def __init__(self):
        super().__init__()
        pass

    def is_instruct(self):
        return True

    def stop_conditions(self, tokenizer, settings):
        return \
            [tokenizer.eos_token_id]

    def format(self, prompt, response, system_prompt, settings):
        text = "<s>[INST] "
        if system_prompt and system_prompt.strip() != "":
            text += "<<SYS>>\n"
            text += system_prompt
            text += "\n<</SYS>>\n\n "
        text += prompt
        text += " [/INST]"
        if response:
            text += response
            text += "</s>"
        return text

class PromptFormat_mistral(PromptFormat):

    def __init__(self):
        super().__init__()
        pass

    def is_instruct(self):
        return True

    def stop_conditions(self, tokenizer, settings):
        return \
            [tokenizer.eos_token_id]

    def context_bos(self):
        return True

class PromptFormat_mistralv1(PromptFormat_mistral):
    """
    <s> [INST] user message [/INST] assistant message</s> [INST] new user message [/INST]
    """
    description = "Mistral tokenizer v1"

    def __init__(self):
        super().__init__()
        pass

    def format(self, p, r, sp, settings):
        if sp and sp.strip():
            text = f" [INST] {sp.strip()}\n\n {p.strip()} [/INST]"
        else:
            text = f" [INST] {p.strip()} [/INST]"
        if r:
            text += f" {r.strip()}</s>"
        return text

class PromptFormat_mistralv2v3(PromptFormat_mistral):
    """
    <s>[INST] user message[/INST] assistant message</s>[INST] new user message[/INST]
    """
    description = "Mistral tokenizer v2/v3"

    def __init__(self):
        super().__init__()
        pass

    def format(self, p, r, sp, settings):
        if sp and sp.strip():
            text = f"[INST] {sp.strip()}\n\n {p.strip()}[/INST]"
        else:
            text = f"[INST] {p.strip()}[/INST]"
        if r:
            text += f" {r.strip()}</s>"
        return text

class PromptFormat_mistralTekken(PromptFormat_mistral):
    """
    <s>[INST]user message[/INST]assistant message</s>[INST]new user message[/INST]
    """
    description = "Mistral tokenizer V3 (Tekken)"

    def format(self, p, r, sp, settings):
        if sp and sp.strip():
            text = f"[INST]{sp.strip()}\n\n{p.strip()}[/INST]"
        else:
            text = f"[INST]{p.strip()}[/INST]"
        if r:
            text += f"{r.strip()}</s>"
        return text


class PromptFormat_llama3(PromptFormat):

    description = "Llama-3 instruct template."

    def __init__(self):
        super().__init__()
        pass

    def is_instruct(self):
        return True

    def stop_conditions(self, tokenizer, settings):
        return \
            [tokenizer.single_id("<|eot_id|>"),
             tokenizer.single_id("<|start_header_id|>"),
             tokenizer.eos_token_id]

    def format(self, prompt, response, system_prompt, settings):
        text = ""
        if system_prompt and system_prompt.strip() != "":
            text += "<|start_header_id|>system<|end_header_id|>\n\n"
            text += system_prompt
            text += "<|eot_id|>"
        text += "<|start_header_id|>user<|end_header_id|>\n\n"
        text += prompt
        text += "<|eot_id|>"
        text += "<|start_header_id|>assistant<|end_header_id|>\n\n"
        if response:
            text += response
            text += "<|eot_id|>"
        return text

    def context_bos(self):
        return True


class PromptFormat_phi3(PromptFormat):

    description = "Phi-3 instruct"

    def __init__(self):
        super().__init__()
        pass

    def is_instruct(self):
        return True

    def stop_conditions(self, tokenizer, settings):
        return \
            [tokenizer.single_id("<|end|>"),
             tokenizer.single_id("<|assistant|>"),
             tokenizer.single_id("<|endoftext|>"),
             tokenizer.eos_token_id]

    def format(self, prompt, response, system_prompt, settings):
        text = ""
        if system_prompt and system_prompt.strip() != "":
            text += "<|system|>\n"
            text += system_prompt
            text += "<|end|>\n"
        text += "<|user|>\n"
        text += prompt
        text += "<|end|>\n"
        text += "<|assistant|>\n"
        if response:
            text += response
            text += "<|end|>"
        return text

    def context_bos(self):
        return True


class PromptFormat_mistrallite(PromptFormat):

    description = "MistralLite format"

    def __init__(self):
        super().__init__()
        pass

    def is_instruct(self):
        return True

    def stop_conditions(self, tokenizer, settings):
        return \
            [tokenizer.eos_token_id]

    def format(self, prompt, response, system_prompt, settings):
        text = "<|prompter|>"
        if system_prompt and system_prompt.strip() != "":
            text += system_prompt
            text += "</s><|assistant|>Understood.</s><|prompter|>"
        text += prompt
        text += "</s><|assistant|>"
        if response:
            text += response
            text += "</s>"
        return text

# class PromptFormat_codellama(PromptFormat_llama):
#
#     description = "CodeLlama-instruct"
#
#     def __init__(self):
#         super().__init__()
#         pass
#
#     def default_system_prompt(self):
#         return \
#             """You are a helpful coding assistant. Always answer as helpfully as possible."""


class PromptFormat_chatml(PromptFormat):

    description = "ChatML format, as used by e.g. (Mistral)Orca"

    def __init__(self):
        super().__init__()
        pass

    def is_instruct(self):
        return True

    def stop_conditions(self, tokenizer, settings):
        return \
            [tokenizer.eos_token_id,
             """<|im_end|>"""]

    def format(self, prompt, response, system_prompt, settings):
        text = ""
        if system_prompt and system_prompt.strip() != "":
            text += "<|im_start|>system\n"
            text += system_prompt
            text += "\n<|im_end|>\n"
        text += "<|im_start|>user\n"
        text += prompt
        text += "<|im_end|>\n"
        text += "<|im_start|>assistant\n"
        if response:
            text += response
            text += "<|im_end|>\n"
        return text

    def context_bos(self):
        return True


class PromptFormat_tinyllama(PromptFormat_chatml):

    description = "ChatML format, but ignoring special/added tokens. Use for TinyLlama-chat v0.3"

    def encode_special_tokens(self):
        return False


class PromptFormat_phind_codellama(PromptFormat):

    description = "Vicuna/Alpaca-like format for Phind-CodeLlama"

    def __init__(self):
        super().__init__()
        pass

    def is_instruct(self):
        return True

    def stop_conditions(self, tokenizer, settings):
        return \
            [tokenizer.eos_token_id, "\n### "]

    def format(self, prompt, response, system_prompt, settings):
        text = ""
        if system_prompt and system_prompt.strip() != "":
            text += "### System Prompt\n"
            text += system_prompt
            text += "\n\n"
        text += "### User Message\n"
        text += prompt
        text += "\n\n### Assistant\n"
        if response:
            text += response
            text += "\n\n"
        return text


class PromptFormat_deepseek_chat(PromptFormat):

    description = "Deepseek LLM chat format"

    def __init__(self):
        super().__init__()
        pass

    def is_instruct(self):
        return True

    def stop_conditions(self, tokenizer, settings):
        return \
            [tokenizer.eos_token_id, "\n\nAssistant:"]

    def format(self, prompt, response, system_prompt, settings):
        text = ""
        if system_prompt and system_prompt.strip() != "":
            text += system_prompt
            text += "\n\n"
        text += "User: "
        text += prompt
        text += "\n\nAssistant:"
        if response:
            text += response
            text += "\n\n"
        return text


class PromptFormat_deepseek_instruct(PromptFormat):

    description = "Deepseek instruct format for 'coder' models"

    def __init__(self):
        super().__init__()
        pass

    def is_instruct(self):
        return True

    def stop_conditions(self, tokenizer, settings):
        return \
            [tokenizer.eos_token_id, "<|EOT|>"]

    def format(self, prompt, response, system_prompt, settings):
        text = ""
        if system_prompt and system_prompt.strip() != "":
            text += "<｜begin▁of▁sentence｜>"
            text += system_prompt
            text += "\n"
        text += "### Instruction:\n"
        text += prompt
        text += "\n### Response:\n"
        if response:
            text += response
            text += "\n<|EOT|>\n"
        return text


class PromptFormat_openchat(PromptFormat):

    description = "OpenChat"

    def __init__(self):
        super().__init__()
        pass

    def is_instruct(self):
        return True

    def stop_conditions(self, tokenizer, settings):
        return \
            [tokenizer.eos_token_id,
             "<|end_of_turn|>",
             "<|endoftext|>",
             "GPT4 Correct User:"
             ]

    def format(self, prompt, response, system_prompt, settings):
        text = ""
        if system_prompt and system_prompt.strip() != "":
            text += system_prompt
            text += "<|end_of_turn|>"
        text += "GPT4 Correct User:"
        text += prompt
        text += "<|end_of_turn|>"
        text += "GPT4 Correct Assistant:"
        if response:
            text += response
            text += "<|end_of_turn|>"
        return text


class PromptFormat_gemma(PromptFormat):

    description = "OpenChat"

    def __init__(self):
        super().__init__()
        pass

    def is_instruct(self):
        return True

    def stop_conditions(self, tokenizer, settings):
        return \
            [tokenizer.eos_token_id,
             "<end_of_turn>",
             ]

    def format(self, prompt, response, system_prompt, settings):
        text = ""
        if system_prompt is not None:
            text += "<bos>"
            # s = system_prompt.strip()
            # if s != "":
            #     text += "<start_of_turn>user\n"
            #     text += s + "<end_of_turn>\n"
            #     text += "<start_of_turn>model\n"
            #     text += "Okay!<end_of_turn>\n"
        text += "<start_of_turn>user\n"
        text += prompt
        text += "<end_of_turn>\n"
        text += "<start_of_turn>model\n"
        if response:
            text += response
            text += "<end_of_turn>\n"
        return text

    @staticmethod
    def supports_system_prompt():
        return False


class PromptFormat_cohere(PromptFormat):

    description = "Cohere"

    def __init__(self):
        super().__init__()
        pass

    def is_instruct(self):
        return True

    def stop_conditions(self, tokenizer, settings):
        return \
            [tokenizer.eos_token_id,
             "<|END_OF_TURN_TOKEN|>",
             ]

    def format(self, prompt, response, system_prompt, settings):
        text = ""
        if system_prompt is not None:
            text += "<BOS_TOKEN>"
            text += "<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>"
            text += system_prompt.strip()
            text += "<|END_OF_TURN_TOKEN|>"
        text += "<|START_OF_TURN_TOKEN|><|USER_TOKEN|>"
        text += prompt
        text += "<|END_OF_TURN_TOKEN|>"
        text += "<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>"
        if response:
            text += response
            text += "<|END_OF_TURN_TOKEN|>"
        return text


class PromptFormat_granite(PromptFormat):

    description = "Granite"

    def __init__(self):
        super().__init__()
        pass

    def is_instruct(self):
        return True

    def stop_conditions(self, tokenizer, settings):
        return \
            [tokenizer.eos_token_id,
             "\n\nQuestion:",
             ]

    def format(self, prompt, response, system_prompt, settings):
        text = ""
        if system_prompt is not None:
            text += "System:\n"
            text += system_prompt.strip()
            text += "\n\n"
        text += "Question:\n"
        text += prompt
        text += "\n\n"
        text += "Answer:\n"
        if response:
            text += response
            text += "\n\n"
        return text

    def context_bos(self):
        return True


prompt_formats = \
{
    "Chat-RP": PromptFormat_raw,
    "Llama-chat": PromptFormat_llama,
    "Llama3-instruct": PromptFormat_llama3,
    "ChatML": PromptFormat_chatml,
    "TinyLlama-chat": PromptFormat_tinyllama,
    "MistralLite": PromptFormat_mistrallite,
    "Phind-CodeLlama": PromptFormat_phind_codellama,
    "Deepseek-chat": PromptFormat_deepseek_chat,
    "Deepseek-instruct": PromptFormat_deepseek_instruct,
    "OpenChat": PromptFormat_openchat,
    "Gemma": PromptFormat_gemma,
    "Cohere": PromptFormat_cohere,
    "Phi3-instruct": PromptFormat_phi3,
    "Granite": PromptFormat_granite,
    "Mistral V1": PromptFormat_mistralv1,
    "Mistral V2/V3": PromptFormat_mistralv2v3,
    "Mistral V3 (Tekken)": PromptFormat_mistralTekken,
}

def list_prompt_formats():
    global prompt_formats
    prompts = [
        {
            "name": k,
            "supports_system_prompt": v.supports_system_prompt()
        }
        for k, v in prompt_formats.items()
    ]
    return prompts
