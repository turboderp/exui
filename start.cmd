@echo off

REM Installing requirements for exui
pip install -r requirements.txt

REM Cloning exllamav2 repository
git clone https://github.com/turboderp/exllamav2

REM Installing exllamav2 using setup.py
cd exllamav2
python setup.py install --user
cd exui

REM Running server.py from exui directory
python exui/server.py --host 127.0.0.1:5000
