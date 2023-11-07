<p align="center">

# ExUI

This is a simple, lightweight browser-based UI for running local inference using [ExLlamaV2](https://github.com/turboderp/exllamav2).

### Overview of features

- Friendly, responsive and minimalistic UI
- Persistent sessions
- Multiple instruct formats
- Speculative decoding
- Supports EXL2, GPTQ and FP16 models

### Screenshots

[![chat_screenshot](doc/screenshot_1_thumb.png)](doc/screenshot_1.png)
[![chat_screenshot](doc/screenshot_2_thumb.png)](doc/screenshot_2.png)
[![chat_screenshot](doc/screenshot_3_thumb.png)](doc/screenshot_3.png)
[![chat_screenshot](doc/screenshot_4_thumb.png)](doc/screenshot_4.png)
[![chat_screenshot](doc/screenshot_5_thumb.png)](doc/screenshot_5.png)

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

Prebuilt wheels for ExLlamaV2 are available [here](https://github.com/turboderp/exllamav2/releases). Installing 
the latest version of [Flash Attention](https://github.com/Dao-AILab/flash-attention) is recommended. 

### More to come

Stay tuned.

![avatar_unicorn.png](static%2Fgfx%2Favatar_unicorn.png)


