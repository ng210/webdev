@echo off
:: Preparations
setlocal EnableDelayedExpansion

REM if not "%~x2" == ".js" (
REM     echo Not .js file as input!
REM     goto end
REM )

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
set base=%1
set source=%~dp2

REM echo *** Build js
REM echo %tools%jsbuild.exe v base=%1 in=%2 out=%3
REM %tools%jsbuild.exe v base=%1 in=%2 out=%3

:: Deploy to tomcat
set deploy=%source%deploy.lst
for /f "tokens=1,2*" %%i in (%deploy%) do (
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
    ) else (
    if "%%i"=="run" (
        set _t1=%%j %%k
        set _t2=!_t1:{tools}=%tools%!
        set _t1=!_t2:{base}=%base%\src!
        echo Exeute !_t1!
        call !_t1!
    )))
)
if exist log.txt del log.txt

:end

exit