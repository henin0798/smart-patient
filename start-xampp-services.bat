@echo off
echo ========================================================
echo   Starting XAMPP Services for Smart Patient
echo ========================================================

echo Starting MySQL on port 3306...
start "" /b "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --console

echo Starting Apache on port 80...
start "" /b "C:\xampp\apache\bin\httpd.exe" -d "C:/xampp/apache"

timeout /t 3 /nobreak > nul

echo.
echo ========================================================
echo   Services are running!
echo   - phpMyAdmin: http://localhost/phpmyadmin/
echo   - MySQL Port: 3306 (database: smart_patient_db)
echo   - Spring Boot Backend: http://localhost:8080/api/
echo ========================================================

