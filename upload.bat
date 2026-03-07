@echo off
echo Uploading StarSong Orchestra to GitHub...
echo.

cd /d C:\Users\fiker\StudioProjects\StarsongOrchestra

echo Adding all files...
git add -A

echo Committing changes...
git commit -m "Update: Re-upload all files with fixed workflow"

echo Pushing to GitHub...
git push origin main

echo.
echo Done! Check https://github.com/FikerBiruk/StarsongOrchestra
echo.
pause

