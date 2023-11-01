# EX UI - Official Web UI for ExLlamaV2

## Overview of features

- Save multiple model configurations at once and persist them between sessions for easier multi-model loading
- Maintain several chats at once with individual chat sessions
- Supports latest ExLlamaV2 models

## Running locally

First, clone this repository and install requirements:

```
git clone https://github.com/turboderp/exui
cd exui
pip install -r requirements.txt
```

Now you can run the web interface with the included server.py:

```
python server.py
```

Now you're ready to connect on localhost:5000

### Available flags

| Flag              | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `-h`, `--help`    | show this help message and exit                                             |
| `-host`, `--host` | Set the host and port with IP:PORT, eg 0.0.0.0:7860, default localhost:5000 |
| `-d`, `--dir`     | Location for user data and sessions, default: ~/exui                        |
