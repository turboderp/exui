<p align="center">

# ExUI

This is a simple, lightweight web interface for [ExLlamaV2](https://github.com/turboderp/exllamav2).

### Overview of features

- Friendly, responsive and minimalistic UI
- Persistent sessions
- Multiple instruct formats
- Speculative decoding
- Supports EXL2, GPTQ and FP16 models

### Screenshots

[![chat_screenshot](doc/screenshot1_thumb.png)](doc/screenshot1.png)
[![chat_screenshot](doc/screenshot2_thumb.png)](doc/screenshot2.png)

### Running locally

First, clone this repository and install requirements:

```
git clone https://github.com/turboderp/exui
cd exui
pip install -r requirements.txt
```

Then run the web server with the included server.py:

```
python server.py
```

Your browser should automatically open on the default IP/port. Config and sessions are stored in `~/exui` by default.

Prebuilt wheels for ExLlamaV2 are available [here](https://github.com/turboderp/exllamav2/releases).

### More to come

Stay tuned.

![avatar_unicorn.png](static%2Fgfx%2Favatar_unicorn.png)


