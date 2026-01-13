#!/bin/bash

# Activate conda environment
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate paper-reps

# Start backend in background
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend in background
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait for both processes
echo "Conda Environment: $CONDA_DEFAULT_ENV"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Trap Ctrl+C and kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Wait for both processes
wait