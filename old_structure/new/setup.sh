#!/bin/bash

# Setup script for the reusable frontend base
# This script automates the initial setup process

set -e

echo "🚀 Frontend Base Setup Script"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "QUICKSTART.md" ]; then
    echo "❌ Error: Please run this script from the 'new/' directory"
    exit 1
fi

# Navigate to base_frontend
cd base_frontend

echo "📦 Step 1: Installing dependencies..."
echo "This may take a few minutes..."
npm install

echo ""
echo "⚙️  Step 2: Setting up environment..."
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local from template"
else
    echo "ℹ️  .env.local already exists, skipping..."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. cd base_frontend"
echo "   2. npm run dev"
echo "   3. Open http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   - Quick Start: ../QUICKSTART.md"
echo "   - Full Docs: ../README.md"
echo "   - Auth Guide: ../auth_frontend/README.md"
echo ""
echo "🎉 Happy coding!"
