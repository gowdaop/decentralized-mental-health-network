#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Print a message to indicate the start of the deployment process
echo "Starting deployment..."

# --- Blockchain Deployment ---
echo "Deploying blockchain..."
cd blockchain
npm install
npx hardhat compile
# Note: You may want to change the --network parameter to your desired network
npx hardhat run scripts/deploy.js --network localhost
cd ..
echo "Blockchain deployment finished."

# --- Backend Deployment ---
echo "Deploying backend..."
cd backend
# Assuming you have a virtual environment set up. If not, you might want to create one.
# python -m venv venv
# source venv/bin/activate
pip install -r requirements.txt
cd ..
echo "Backend deployment finished."

# --- Frontend Deployment ---
echo "Deploying frontend..."
cd frontend
npm install
npm run build
cd ..
echo "Frontend deployment finished."

echo "Deployment finished."
