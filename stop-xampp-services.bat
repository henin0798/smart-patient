@echo off
echo Stopping Apache...
taskkill /F /IM httpd.exe /T 2>nul
echo Stopping MySQL...
taskkill /F /IM mysqld.exe /T 2>nul
echo Done!

