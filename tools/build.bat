@echo off
:: Preparations
setlocal EnableDelayedExpansion
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
echo %tools%\jsbuild.exe v base=%1 in=%2 out=%3
%tools%\jsbuild.exe v base=%1 in=%2 out=%3

:: Deploy to tomcat
echo *** Deploy to tomcat
for /f "tokens=1,2" %%i in (%source%\deploy.lst) do (
    if "%%i"=="target" (
        if not exist %%j (
            echo create directory %%j
            mkdir %%j
        )
        set target_=%%j
        echo Changed target to !target_!
    ) else (
        if "%%i"=="copy" (
            echo deploy %1\%%j
            copy /y %1\%%j !target_! >> log.txt
        )
    )
)
if exist log.txt del log.txt

:end

exit