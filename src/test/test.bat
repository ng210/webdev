@echo off

setlocal EnableDelayedExpansion
set baka=?
:loop
for /f "delims= tokens=1,2" %%i in (deploy.lst) do (
    set baka=%%i
    echo %%i.!baka!
)
