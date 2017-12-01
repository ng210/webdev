@echo off
for /f "delims=: tokens=1,2" %%i in (deploy.lst) do (
    if "%%i"=="target" (
        if not exist %%j mkdir %%j
        set target=%%j
    )
)
if "%target%"=="" (
    echo Missing deploy target!
    goto end
)
for /f "delims=: tokens=1,2" %%i in (deploy.lst) do (
    if "%%i"=="copy" echo copy %%j %target%
)

:end