"""
Advanced PDF Processor with Image Support
Handles text extraction, images, tables, and OCR
"""

import fitz  # PyMuPDF
import pdfplumber
from PIL import Image
import io
import json
import base64
import google.generativeai as genai
from typing import Dict, List, Any
import asyncio

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
vision_model = genai.GenerativeModel("gemini-pro-vision")
text_model = genai.GenerativeModel("gemini-pro")

class AdvancedPDFProcessor:
    """Advanced PDF processing with multi-format support"""
    
    def __init__(self):
        self.extracted_images = []
        self.extracted_tables = []
    
    async def process_pdf(self, pdf_bytes: bytes, user_id: str) -> Dict[str, Any]:
        """
        Process PDF with support for text, images, and tables
        Returns structured document representation
        """
        result = {
            "text": "",
            "pages": [],
            "has_images": False,
            "has_tables": False,
            "images_analyzed": 0,
            "metadata": {
                "title": "",
                "author": "",
                "creation_date": "",
            },
            "structure": []  # Maintain document structure
        }
        
        try:
            # Step 1: Extract with pdfplumber (better layout)
            await self._extract_with_pdfplumber(pdf_bytes, result)
        except Exception as e:
            print(f"[PDF] pdfplumber error: {e}")
        
        try:
            # Step 2: Extract images with PyMuPDF + Gemini Vision
            await self._extract_images_with_gemini(pdf_bytes, result)
        except Exception as e:
            print(f"[PDF] Image extraction error: {e}")
        
        if not result["text"].strip():
            raise ValueError("Could not extract any content from PDF")
        
        return result
    
    async def _extract_with_pdfplumber(self, pdf_bytes: bytes, result: Dict):
        """Extract text and tables with pdfplumber"""
        
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page_idx, page in enumerate(pdf.pages, 1):
                page_data = {
                    "page": page_idx,
                    "text": page.extract_text() or "",
                    "tables": [],
                    "images": [],
                    "sections": []
                }
                
                # Extract tables
                tables = page.extract_tables()
                if tables:
                    result["has_tables"] = True
                    for table_idx, table in enumerate(tables):
                        table_json = {
                            "index": table_idx,
                            "data": table
                        }
                        page_data["tables"].append(table_json)
                        
                        # Add table to text
                        table_text = self._table_to_text(table)
                        page_data["text"] += f"\n[TABLE {table_idx + 1}]\n{table_text}\n[/TABLE]\n"
                
                result["pages"].append(page_data)
                
                # Build main text with structure
                result["text"] += f"\n{'='*60}\nPAGE {page_idx}\n{'='*60}\n"
                result["text"] += page_data["text"] + "\n"
    
    async def _extract_images_with_gemini(self, pdf_bytes: bytes, result: Dict):
        """Extract and analyze images with Gemini Vision"""
        
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        for page_num, page in enumerate(doc, 1):
            image_list = page.get_images()
            
            if not image_list:
                continue
            
            result["has_images"] = True
            
            for img_index, img in enumerate(image_list):
                try:
                    xref = img[0]
                    pix = fitz.Pixmap(doc, xref)
                    
                    # Convert to PNG
                    if pix.n - pix.alpha < 4:  # GRAY or RGB
                        img_bytes = pix.tobytes("png")
                    else:
                        pix = fitz.Pixmap(fitz.csRGB, pix)
                        img_bytes = pix.tobytes("png")
                    
                    # Analyze with Gemini Vision
                    image_description = await self._analyze_image(img_bytes)
                    
                    image_info = {
                        "page": page_num,
                        "index": img_index,
                        "description": image_description,
                        "base64": base64.b64encode(img_bytes).decode()  # Store for UI
                    }
                    
                    # Update page data
                    if page_num <= len(result["pages"]):
                        result["pages"][page_num - 1]["images"].append(image_info)
                    
                    # Add to main text
                    result["text"] += f"\n[IMAGE on PAGE {page_num}-{img_index}]\n"
                    result["text"] += f"AI ANALYSIS: {image_description}\n"
                    result["text"] += "[/IMAGE]\n"
                    
                    result["images_analyzed"] += 1
                
                except Exception as e:
                    print(f"[IMAGE] Error processing image {img_index} on page {page_num}: {e}")
        
        doc.close()
    
    async def _analyze_image(self, image_bytes: bytes) -> str:
        """Use Gemini Vision to analyze image"""
        try:
            img = Image.open(io.BytesIO(image_bytes))
            
            response = vision_model.generate_content([
                "Analyze this image in detail. Describe what it shows, any text visible, charts, diagrams, etc. Be comprehensive.",
                img
            ])
            
            return response.text
        
        except Exception as e:
            print(f"[GEMINI VISION] Error: {e}")
            return "Image analysis failed"
    
    def _table_to_text(self, table: List[List]) -> str:
        """Convert table to readable text"""
        if not table:
            return ""
        
        # Find max widths
        widths = [max(len(str(row[i]) or "") for row in table) for i in range(len(table[0]))]
        
        lines = []
        for row in table:
            cells = []
            for i, cell in enumerate(row):
                cells.append(str(cell or "").ljust(widths[i]))
            lines.append(" | ".join(cells))
        
        return "\n".join(lines)

# Initialize processor
pdf_processor = AdvancedPDFProcessor()

# Usage in main.py:
# result = await pdf_processor.process_pdf(pdf_bytes, user_id)