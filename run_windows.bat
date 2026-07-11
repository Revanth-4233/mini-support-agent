@echo off
title Mini Support Agent Launcher
cls
:menu
cls
echo ===================================================
echo             Mini Support Agent Launcher            
echo ===================================================
echo.
echo  1. Start Web Server (http://localhost:8000)
echo  2. Start Interactive CLI Mode
echo  3. Run Automated Test Runner
echo  4. Exit
echo.
echo ===================================================
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto run_web
if "%choice%"=="2" goto run_cli
if "%choice%"=="3" goto run_tests
if "%choice%"=="4" goto exit
echo Invalid choice. Press any key to try again...
pause >nul
goto menu

:run_web
echo.
echo Starting Web Server...
python app.py
echo.
echo Web server stopped. Press any key to return to menu...
pause >nul
goto menu

:run_cli
echo.
echo Starting Interactive CLI...
python app.py --interactive
echo.
echo CLI session ended. Press any key to return to menu...
pause >nul
goto menu

:run_tests
echo.
echo Running Automated Test Suite...
python test_runner.py
echo.
echo Tests completed. Press any key to return to menu...
pause >nul
goto menu

:exit
echo Goodbye!
exit
