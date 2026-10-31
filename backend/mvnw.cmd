@echo off
if not defined JAVA_HOME (
    if exist "C:\Program Files\Android\Android Studio\jbr" (
        set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
    )
)
if exist "%~dp0\.maven\apache-maven-3.9.6\bin\mvn.cmd" (
    "%~dp0\.maven\apache-maven-3.9.6\bin\mvn.cmd" %*
) else if exist "C:\Program Files\Apache NetBeans\java\maven\bin\mvn.cmd" (
    "C:\Program Files\Apache NetBeans\java\maven\bin\mvn.cmd" %*
) else if exist "%MAVEN_HOME%\bin\mvn.cmd" (
    "%MAVEN_HOME%\bin\mvn.cmd" %*
) else (
    mvn %*
)
