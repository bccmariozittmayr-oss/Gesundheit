@echo off
rem Richtet die taegliche WHOOP-Abholung in der Windows-Aufgabenplanung ein.
rem Zwei Laeufe: 07:30 (holt die fertigen Werte des Vortags und die Erholung von heute)
rem und 12:30 als zweite Chance, falls der Laptop um 07:30 aus war.
rem Rueckgaengig:  schtasks /delete /tn "Gesundheit WHOOP frueh" /f
rem                schtasks /delete /tn "Gesundheit WHOOP mittag" /f
setlocal
set SKRIPT=%~dp0whoop-taeglich.cmd
echo Richte die Aufgaben ein fuer: %SKRIPT%
schtasks /create /tn "Gesundheit WHOOP frueh"  /tr "\"%SKRIPT%\"" /sc DAILY /st 07:30 /f
schtasks /create /tn "Gesundheit WHOOP mittag" /tr "\"%SKRIPT%\"" /sc DAILY /st 12:30 /f
echo.
echo Fertig. Pruefen mit:  schtasks /query /tn "Gesundheit WHOOP frueh" /v /fo LIST
echo Protokoll der Laeufe: %LOCALAPPDATA%\whoop-abholen.log
endlocal
