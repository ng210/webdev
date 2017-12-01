@echo off
:: Preparations
setlocal
for %%i in (%0) do (
    set tools=%%~dpi
)
set tmp=%2
:loop
for /f "delims=\ tokens=1*" %%i in ("%tmp%") do (
    if not "%%j"=="" (
        if not defined source (
            set source=%1\%%i
        ) else (
            set source=%source%\%%i
        )
    )
    set tmp=%%j
)
if defined tmp goto loop

echo *** Build js
%tools%\jsbuild.exe base=%1 in=%2 out=%3

:: Deploy to tomcat
cd
echo *** Deploy to tomcat
for /f "tokens=1,2" %%i in (%source%\deploy.lst) do (
    if "%%i"=="target" (
        if not exist %%j (
            echo create directory %%j
            mkdir %%j
        )
        set target=%%j
    )
)
if "%target%"=="" (
    echo Missing deploy target!
    goto end
)
for /f "tokens=1,2" %%i in (%source%\deploy.lst) do (
    if "%%i"=="copy" (
        echo deploy %source%\%%j
        copy /y %source%\%%j %target% >log.txt
    )
    if exist log.txt del log.txt
)

:end

exit