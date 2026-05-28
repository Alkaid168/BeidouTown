@echo off
chcp 65001 >nul
setlocal ENABLEDELAYEDEXPANSION

title 一键切换前清场 - 北斗镇
cd /d "%~dp0"

echo ==============================================
echo   一键切换前清场（跨项目 Node/端口清理）
echo ==============================================
echo.

echo [1/5] 强制关闭所有 Node 进程...
cmd /c taskkill /F /IM node.exe >nul 2>nul
echo 完成。
echo.

echo [2/5] 清理常见前端开发端口占用（3000/3001/5173/5174）...
for %%P in (3000 3001 5173 5174) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr :%%P') do (
    cmd /c taskkill /F /PID %%A >nul 2>nul
  )
)
echo 完成。
echo.

echo [3/5] 检查残留端口...
set FOUND=0
for %%P in (3000 3001 5173 5174) do (
  for /f "tokens=*" %%L in ('netstat -ano ^| findstr :%%P') do (
    if !FOUND!==0 (
      echo 发现残留：
      set FOUND=1
    )
    echo   %%L
  )
)
if %FOUND%==0 (
  echo 未发现残留端口占用。
)
echo.

echo [4/5] 检查残留 node 进程...
tasklist | findstr /I "node.exe" >nul
if errorlevel 1 (
  echo 未发现 node.exe 进程。
) else (
  echo 发现残留 node.exe：
  tasklist | findstr /I "node.exe"
)
echo.

echo [5/5] 选择下一步：
echo   [Y] 立即启动当前项目（低负载）
echo   [N] 仅清场后退出
set /p CHOICE=请输入 Y 或 N:
if /I "%CHOICE%"=="Y" (
  echo.
  echo 正在启动当前项目开发环境...
  call "%~dp0启动开发环境.bat"
  goto :eof
)

echo.
echo 已完成清场，你可以切换到其他项目。
pause
endlocal
