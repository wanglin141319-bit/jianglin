@echo off
REM Doney 每日复盘 - Windows 运行脚本
REM 用法: run_daily_review.bat
REM 需要设置环境变量: set GITHUB_TOKEN=your_token

cd /d "%~dp0"
set PYTHON=C:\Users\ZhuanZ（无密码）\AppData\Local\Programs\Python\Python312\python.exe
"%PYTHON%" scripts\daily_review.py
pause
