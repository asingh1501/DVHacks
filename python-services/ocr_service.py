#!/usr/bin/env python3
"""
OCR Service for extracting text from PDF files using PyTesseract
"""

import sys
import json
import os
from pathlib import Path

try:
    import pytesseract
    from pdf2image import convert_from_path, convert_from_bytes
    from PIL import Image
    import PyPDF2
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Missing dependency: {str(e)}. Please run: pip install -r requirements.txt"
    }))
    sys.exit(1)


def extract_text_with_ocr(pdf_path=None, pdf_bytes=None):
    """
    Extract text from PDF using OCR (PyTesseract)
    
    Args:
        pdf_path: Path to PDF file (optional)
        pdf_bytes: PDF file as bytes (optional)
    
    Returns:
        dict with success status and extracted text or error
    """
    try:
        # Convert PDF to images
        if pdf_path:
            images = convert_from_path(pdf_path, dpi=300)
        elif pdf_bytes:
            images = convert_from_bytes(pdf_bytes, dpi=300)
        else:
            return {
                "success": False,
                "error": "No PDF input provided"
            }
        
        # Extract text from each page using OCR
        extracted_text = []
        page_count = len(images)
        
        for i, image in enumerate(images, 1):
            # Perform OCR on the image
            text = pytesseract.image_to_string(image, lang='eng')
            extracted_text.append(f"--- Page {i} ---\n{text.strip()}")
        
        # Combine all text
        full_text = "\n\n".join(extracted_text)
        
        return {
            "success": True,
            "text": full_text,
            "metadata": {
                "page_count": page_count,
                "method": "ocr"
            }
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": f"OCR extraction failed: {str(e)}"
        }


def extract_text_standard(pdf_path=None, pdf_bytes=None):
    """
    Try to extract text using standard PDF text extraction (faster, but might not work for scanned PDFs)
    
    Args:
        pdf_path: Path to PDF file (optional)
        pdf_bytes: PDF file as bytes (optional)
    
    Returns:
        dict with success status and extracted text or error
    """
    try:
        if pdf_path:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text_parts = []
                
                for page_num, page in enumerate(pdf_reader.pages, 1):
                    page_text = page.extract_text()
                    if page_text.strip():
                        text_parts.append(f"--- Page {page_num} ---\n{page_text.strip()}")
                
                full_text = "\n\n".join(text_parts)
                
                # If we got meaningful text, return it
                if len(full_text.strip()) > 50:
                    return {
                        "success": True,
                        "text": full_text,
                        "metadata": {
                            "page_count": len(pdf_reader.pages),
                            "method": "standard"
                        }
                    }
        
        # If standard extraction didn't work or got too little text, return None to trigger OCR
        return None
    
    except Exception as e:
        # If standard extraction fails, we'll fall back to OCR
        return None


def process_pdf(pdf_input, use_ocr=False):
    """
    Process PDF file and extract text, trying standard extraction first, then OCR if needed
    
    Args:
        pdf_input: Either a file path (str) or bytes
        use_ocr: If True, skip standard extraction and go straight to OCR
    
    Returns:
        JSON string with result
    """
    is_path = isinstance(pdf_input, str)
    
    # Try standard extraction first (unless OCR is explicitly requested)
    if not use_ocr and is_path:
        result = extract_text_standard(pdf_path=pdf_input)
        if result and result.get("success"):
            return result
    
    # Fall back to OCR
    if is_path:
        return extract_text_with_ocr(pdf_path=pdf_input)
    else:
        return extract_text_with_ocr(pdf_bytes=pdf_input)


def main():
    """Main entry point for CLI usage"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python ocr_service.py <pdf_file_path> [--force-ocr]"
        }))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    force_ocr = "--force-ocr" in sys.argv
    
    if not os.path.exists(pdf_path):
        print(json.dumps({
            "success": False,
            "error": f"File not found: {pdf_path}"
        }))
        sys.exit(1)
    
    result = process_pdf(pdf_path, use_ocr=force_ocr)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
