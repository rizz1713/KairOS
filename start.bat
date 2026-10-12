@echo off
echo ======================================================================
echo  KAIROS - Kernel-Aware Intelligent Resource Orchestration System
echo ======================================================================
echo Starting FastAPI Backend on port 8000 and Vite React Frontend on port 5173...

start "KAIROS Backend (FastAPI)" cmd /k "cd backend && python run.py"
start "KAIROS Frontend (React Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo KAIROS services launched:
echo  - Frontend UI:  http://localhost:5173
echo  - Backend API:  http://localhost:8000
echo  - API Docs:     http://localhost:8000/docs
echo ======================================================================
pause
