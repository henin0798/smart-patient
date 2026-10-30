@echo off
if exist "C:\Program Files\Apache NetBeans\java\maven\bin\mvn.cmd" (
    "C:\Program Files\Apache NetBeans\java\maven\bin\mvn.cmd" %*
) else if exist "%MAVEN_HOME%\bin\mvn.cmd" (
    "%MAVEN_HOME%\bin\mvn.cmd" %*
) else (
    mvn %*
)
