#!/bin/bash

# Installing requirements for exui
pip install -r requirements.txt

# Cloning exllamav2 repository
git clone https://github.com/turboderp/exllamav2

# Installing exllamav2 using setup.py
cd exllamav2
python setup.py install --user
cd exui 

# Running server.py from exui directory
python exui/server.py --host 127.0.0.1:5000
