# Manually Installing PyTorch and Exllamav2
If you own a video adapter or computer with NVidia graphics, and get CUDA errors starting exui, you may need to install precompiled wheels 
for PyTorch and/or exllamav2. These instructions are written with Windows 11 in mind but they may also work for Windows 10.

## Before you begin
* Before doing anything, make sure official NVidia drivers are installed. Versions installed automatically during Windows installation may not 
function as expected. [Download drivers from the NVidia Download page](https://www.nvidia.com/Download/index.aspx).
* Uninstall torch and exllama2.

```
pip uninstall torch
pip uninstall exllamav2
```

## Finding the CUDA version for your NVidia graphics adapter
NVidia [documents which products support CUDA](https://developer.nvidia.com/cuda-gpus), and basically any NVidia GT, GTX and RTX device will 
support CUDA. However they *do not* document which CUDA versions are supported for each card. General guidance: Newer GTX and all RTX cards 
likely support CUDA 12.1 or later. Older cards are more likely to support CUDA 11.8.

* Play it safe: use CUDA 11.8
* Have newer gaming hardware? Try CUDA 12.1

## Installing Pre-Complied PyTorch
Visit the [PyTorch Get Started Locally page](https://pytorch.org/get-started/locally/). Choose the appropriate options to be given the PIP URL 
to intall PyTorch.

1. PyTorch Build: stable
2. Your OS
3. Package type: PIP
4. Language: Python
5. Computer Platform: select the CUDA version that matches your video adapter.

Copy and paste the command given by the PyTorch website into your Terminal.

```
Example: pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```
Once PyTorch is installed, it is time to install exllamav2.

## Installing Pre-Complied Exllamav2

1. [Download the correct pre-compiled wheel](https://github.com/turboderp/exllamav2/releases). Choose the correct wheel. For example if
   you have Windows 11 or Windows 10 running on a 64-bit CPU (most common), are using CUDA 12.1, and Python 3.10, download 
   ```exllamav2-0.0.9+cu121-cp310-cp310-win_amd64.whl```. If you are using Python 3.11, choose 
   ```exllamav2-0.0.9+cu121-cp311-cp311-win_amd64.whl```.
2. Use pip to install the downloaded wheel:

```
Example: pip install path\to\downloaded\file\exllamav2-0.0.9+cu121-cp311-cp311-win_amd64.whl.
```
## Start exui

With those packages installed, you should now be able to launch exui by entering ```python server.py``` in the Terminal.
