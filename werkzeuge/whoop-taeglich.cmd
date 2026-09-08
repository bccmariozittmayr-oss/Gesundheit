@echo off
rem Taeglicher WHOOP-Abruf fuer die Gesundheits-App (Windows-Aufgabenplanung). Schreibt nur die verschluesselte whoop.enc.json ins Repo.
cd /d "%~dp0.."
node werkzeuge\whoop-abholen.js holen --push >> "%LOCALAPPDATA%\whoop-abholen.log" 2>&1
