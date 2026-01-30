#!/bin/bash

echo "🔧 Setting up Python OCR service..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Check for Tesseract
if ! command -v tesseract &> /dev/null; then
    echo "⚠️  Tesseract OCR is not installed."
    echo "Please install it:"
    echo "  macOS:    brew install tesseract"
    echo "  Ubuntu:   sudo apt-get install tesseract-ocr"
    echo "  Windows:  Download from https://github.com/UB-Mannheim/tesseract/wiki"
    exit 1
fi

echo "✓ Tesseract found: $(tesseract --version | head -n 1)"

# Check for Poppler (for pdf2image)
if command -v pdfinfo &> /dev/null; then
    echo "✓ Poppler found"
else
    echo "⚠️  Poppler is not installed."
    echo "Please install it:"
    echo "  macOS:    brew install poppler"
    echo "  Ubuntu:   sudo apt-get install poppler-utils"
    echo "  Windows:  Download from https://github.com/oschwartz10612/poppler-windows/releases"
    exit 1
fi

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
cd python-services
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Python OCR service setup complete!"
    echo ""
    echo "Test the OCR service with:"
    echo "  python3 python-services/ocr_service.py path/to/your/document.pdf"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi
