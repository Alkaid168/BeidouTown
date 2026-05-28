@echo off
chcp 65001 >nul
setlocal

title 北斗镇 - 低负载开发启动

cd /d "%~dp0"

echo [1/5] 关闭遗留 Node 进程...
cmd /c taskkill /F /IM node.exe >nul 2>nul

echo [2/5] 清理 3000 端口占用...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
  cmd /c taskkill /F /PID %%a >nul 2>nul
)

echo [3/5] 设置低负载开发参数...
set NEXT_DISABLE_ESLINT=1
set NEXT_DISABLE_TYPECHECK=1
set NODE_OPTIONS=--max-old-space-size=3072

echo [4/5] 启动开发服务器...
echo 访问: http://localhost:3000/tavern
echo.
echo 提示: 当前为低负载模式，提交前请手动运行 lint/test/build。
echo.

echo [5/5] 执行 corepack pnpm dev
corepack pnpm dev

endlocal
pause
