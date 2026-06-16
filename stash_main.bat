@echo off
echo Stashing uncommitted changes in the main workspace...
cd /d "c:\Projects\Akul Dravin HRMS\akul-dravin-hrms"
git stash
echo Done! You can now retry moving the worktree changes.
pause
