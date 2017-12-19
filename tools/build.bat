@echo off
:: Preparations
setlocal EnableDelayedExpansion

if not "%~x2" == ".js" (
    echo Not .js file as input!
    goto end
)
for %%i in (%0) do (
    set tools=%%~dpi
)

REM set tmp=%2
REM :loop
REM for /f "delims=/\ tokens=1*" %%i in ("%tmp%") do (
REM     if not "%%j"=="" (
REM         if not defined source (
REM             set source=%1\%%i
REM         ) else (
REM             set source=%source%\%%i
REM         )
REM     )
REM     set tmp=%%j
REM )
REM if defined tmp goto loop
set source=%~dp2

echo *** Build js
echo %tools%jsbuild.exe v base=%1 in=%2 out=%3
%tools%jsbuild.exe v base=%1 in=%2 out=%3

:: Deploy to tomcat
set deploy=%source%deploy.lst
echo *** Deploy %deploy% to tomcat
for /f "tokens=1,2" %%i in (%deploy%) do (
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