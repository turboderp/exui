
class PromptFormat:

    botname = "Chatbort"
    username = "User"

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
        return False

    # def default_system_prompt(self):
    #     return \
    #         f"""This is a conversation between a helpful AI assistant named {self.botname} and a """ + \
    #         (f"""user named {self.username}.""" if self.username != "User" else """user.""")
    #
    # def first_prompt(self):
    #     return \
    #         f"""<|system_prompt|>\n{self.username}: <|user_prompt|>\n{self.botname}:"""
    #
    # def subs_prompt(self):
    #     return \
    #         f"""{self.username}: <|user_prompt|>\n{self.botname}:"""
    #
    # def stop_conditions(self, tokenizer):
    #     return \
    #         [self.username + ":",
    #          self.username[0:1] + ":",
    #          self.username.upper() + ":",
    #          self.username.lower() + ":",
    #          tokenizer.eos_token_id]
    #
    # def encoding_options(self):
    #     return False, False, False
    #
    # def print_bot_name(self):
    #     return True


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
        if system_prompt:
            text += "<<SYS>>\n"
            text += system_prompt
            text += "\n<</SYS>>\n\n "
        text += prompt
        text += " [/INST]"
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
        if system_prompt:
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


class PromptFormat_tinyllama(PromptFormat_chatml):

    description = "ChatML format, but ignoring special/added tokens. Use for TinyLlama-chat v0.3"

    def encode_special_tokens(self):
        return False


prompt_formats = \
{
    "Chat-RP": PromptFormat_raw,
    "Llama-chat": PromptFormat_llama,
    "ChatML": PromptFormat_chatml,
    "TinyLlama-chat": PromptFormat_tinyllama
}

def list_prompt_formats():
    global prompt_formats
    return list(prompt_formats.keys())


