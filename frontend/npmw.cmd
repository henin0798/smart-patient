@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
if exist "C:\Program Files\nodejs\npm.cmd" (
    "C:\Program Files\nodejs\npm.cmd" %*
) else if exist "%NODE_PATH%\npm.cmd" (
    "%NODE_PATH%\npm.cmd" %*
) else (
    npm %*
)
