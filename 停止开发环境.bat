@echo off
chcp 65001 >nul
setlocal

title 北斗镇 - 停止开发环境

cd /d "%~dp0"

echo 正在停止 Node 开发进程...
cmd /c taskkill /F /IM node.exe >nul 2>nul

echo 正在清理 3000 端口占用...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
  cmd /c taskkill /F /PID %%a >nul 2>nul
)

echo 已完成。
endlocal
pause
