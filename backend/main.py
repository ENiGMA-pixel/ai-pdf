import fitz  # PyMuPDF
import google.generativeai as genai
import os
import uuid
import json
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT
import tempfile
import re

# --- Setup ---
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Use the free model as requested
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")
model = genai.GenerativeModel(MODEL_NAME)

app = FastAPI(title="AI PDF Reader API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store
# Shape: { session_id: { chat, text, sentences, filename, pages, created, chapters, summary, bookmarks } }
sessions = {}


# ─── Request Models ───────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    message: str

class PasteTextRequest(BaseModel):
    text: str
    filename: str = "pasted-text"

class ChapterRequest(BaseModel):
    session_id: str

class ExplainRequest(BaseModel):
    session_id: str
    selected_text: str

class BookmarkRequest(BaseModel):
    session_id: str
    sentence_index: int
    sentence_text: str
    note: str = ""

class DeleteBookmarkRequest(BaseModel):
    session_id: str
    bookmark_id: str


# ─── Helpers ──────────────────────────────────────────────────────────────────

def split_into_sentences(text: str) -> list[str]:
    """Same sentence splitter as the frontend so indices align."""
    text = re.sub(r'\s+', ' ', text).strip()
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s for s in sentences if len(s.strip()) > 3]


def create_session(text: str, filename: str, pages: int, from_paste: bool = False) -> str:
    """Seed a Gemini chat session with the full document text."""
    session_id = str(uuid.uuid4())
    sentences = split_into_sentences(text)

    chat = model.start_chat(history=[
        {
            "role": "user",
            "parts": [f"Please read this document carefully. I will ask questions about it.\n\n{text}"]
        },
        {
            "role": "model",
            "parts": ["I have carefully read the document and I am ready to answer your questions."]
        }
    ])

    sessions[session_id] = {
        "chat": chat,
        "text": text,
        "sentences": sentences,
        "filename": filename,
        "pages": pages,
        "created": datetime.now().isoformat(),
        "chapters": None,
        "summary": None,
        "bookmarks": {},
        "is_from_paste": from_paste,
    }
    return session_id


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ok", "message": "AI PDF Reader API v2.0 is running", "model": MODEL_NAME}


# ─── Upload PDF ───────────────────────────────────────────────────────────────

@app.post("/upload-pdf/")
async def upload_and_read(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    print(f"[UPLOAD] Receiving: {file.filename}")

    pdf_bytes = await file.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    pages_text = []
    for i, page in enumerate(doc):
        pages_text.append({"page": i + 1, "text": page.get_text()})

    full_text = "\n".join(p["text"] for p in pages_text)
    total_pages = len(pages_text)

    if not full_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract text. This PDF may be image-based or scanned."
        )

    session_id = create_session(full_text, file.filename, total_pages)
    sentences = sessions[session_id]["sentences"]

    print(f"[UPLOAD] Done — session={session_id[:8]}, pages={total_pages}, sentences={len(sentences)}")

    return {
        "message": "PDF processed successfully!",
        "session_id": session_id,
        "filename": file.filename,
        "total_pages": total_pages,
        "total_chars": len(full_text),
        "total_sentences": len(sentences),
        "full_text": full_text,
    }


# ─── Chat ─────────────────────────────────────────────────────────────────────

@app.post("/chat/")
async def chat_with_pdf(request: ChatRequest):
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a PDF first.")

    session = sessions[request.session_id]
    print(f"[CHAT] session={request.session_id[:8]} | q={request.message[:60]}")

    response = session["chat"].send_message(request.message)
    return {"ai_response": response.text, "session_id": request.session_id}


# ─── Explain This ─────────────────────────────────────────────────────────────

@app.post("/explain/")
async def explain_text(request: ExplainRequest):
    """Explain a highlighted passage in simple terms."""
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    if not request.selected_text.strip():
        raise HTTPException(status_code=400, detail="No text selected.")

    print(f"[EXPLAIN] session={request.session_id[:8]} | text={request.selected_text[:60]}")

    prompt = (
        f"The user has highlighted this passage from the document:\n\n"
        f"\"{request.selected_text}\"\n\n"
        f"Please explain this in simple, clear language. Keep it under 150 words. "
        f"Use the broader document context you've already read to make it more useful."
    )

    session = sessions[request.session_id]
    response = session["chat"].send_message(prompt)
    return {"explanation": response.text, "session_id": request.session_id}


# ─── Bookmarks ────────────────────────────────────────────────────────────────

@app.post("/bookmark/add/")
async def add_bookmark(request: BookmarkRequest):
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    session = sessions[request.session_id]
    bookmark_id = str(uuid.uuid4())[:8]

    session["bookmarks"][bookmark_id] = {
        "id": bookmark_id,
        "sentence_index": request.sentence_index,
        "sentence_text": request.sentence_text,
        "note": request.note,
        "created": datetime.now().isoformat(),
    }

    print(f"[BOOKMARK] Added {bookmark_id} at sentence {request.sentence_index}")
    return {"bookmark_id": bookmark_id, "bookmarks": list(session["bookmarks"].values())}


@app.delete("/bookmark/delete/")
async def delete_bookmark(request: DeleteBookmarkRequest):
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    session = sessions[request.session_id]
    if request.bookmark_id not in session["bookmarks"]:
        raise HTTPException(status_code=404, detail="Bookmark not found.")

    del session["bookmarks"][request.bookmark_id]
    return {"bookmarks": list(session["bookmarks"].values())}


@app.get("/bookmark/{session_id}")
async def get_bookmarks(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    session = sessions[session_id]
    return {"bookmarks": list(session["bookmarks"].values())}


# ─── Session Info ─────────────────────────────────────────────────────────────

@app.get("/session/{session_id}")
async def get_session(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    s = sessions[session_id]
    return {
        "session_id": session_id,
        "filename": s["filename"],
        "pages": s["pages"],
        "total_chars": len(s["text"]),
        "total_sentences": len(s["sentences"]),
        "created": s.get("created"),
        "chapters": s.get("chapters"),
        "summary": s.get("summary"),
        "bookmark_count": len(s["bookmarks"]),
    }


# ─── Paste to PDF ─────────────────────────────────────────────────────────────

@app.post("/paste-to-pdf/")
async def paste_to_pdf(request: PasteTextRequest):
    """Convert pasted text or chat logs to a PDF, then process it."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text content is empty.")

    pdf_filename = request.filename.strip()
    if not pdf_filename.endswith(".pdf"):
        pdf_filename += ".pdf"

    temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")

    try:
        doc = SimpleDocTemplate(temp_pdf.name, pagesize=letter,
                                leftMargin=0.75*inch, rightMargin=0.75*inch,
                                topMargin=0.75*inch, bottomMargin=0.75*inch)
        story = []
        styles = getSampleStyleSheet()

        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['BodyText'],
            fontSize=11,
            leading=17,
            alignment=TA_LEFT,
            spaceAfter=10,
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=13,
            leading=18,
            spaceAfter=8,
            spaceBefore=14,
        )

        # Detect chat-style lines (e.g. "You:", "ChatGPT:", "User:", "Assistant:")
        chat_pattern = re.compile(r'^(You|User|Human|Me|ChatGPT|Assistant|Claude|AI|Gemini)\s*:', re.IGNORECASE)

        for line in request.text.split('\n'):
            line = line.strip()
            if not line:
                story.append(Spacer(1, 0.1*inch))
                continue
            # Escape XML special chars for reportlab
            safe = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            if chat_pattern.match(line):
                story.append(Paragraph(safe, heading_style))
            else:
                story.append(Paragraph(safe, body_style))

        doc.build(story)

        with open(temp_pdf.name, 'rb') as f:
            pdf_bytes = f.read()

        # Re-extract text from the generated PDF for TTS
        doc_pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text = "\n".join(page.get_text() for page in doc_pdf)
        total_pages = len(doc_pdf)

        if not full_text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from generated PDF.")

        session_id = create_session(full_text, pdf_filename, total_pages, from_paste=True)
        sentences = sessions[session_id]["sentences"]

        print(f"[PASTE-TO-PDF] Done — session={session_id[:8]}, pages={total_pages}")

        return {
            "message": "Text converted to PDF successfully!",
            "session_id": session_id,
            "filename": pdf_filename,
            "total_pages": total_pages,
            "total_chars": len(full_text),
            "total_sentences": len(sentences),
            "full_text": full_text,
        }

    finally:
        if os.path.exists(temp_pdf.name):
            os.remove(temp_pdf.name)


# ─── Smart Chapters ───────────────────────────────────────────────────────────

@app.post("/generate-chapters/")
async def generate_chapters(request: ChapterRequest):
    """Use Gemini to generate a summary and clickable chapter list."""
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    session = sessions[request.session_id]

    # Return cached result if already generated
    if session["chapters"]:
        return {
            "session_id": request.session_id,
            "chapters": session["chapters"],
            "summary": session["summary"],
        }

    full_text = session["text"]
    sentences = session["sentences"]
    print(f"[CHAPTERS] Generating for session={request.session_id[:8]}, sentences={len(sentences)}")

    # Build a text sample with sentence indices so Gemini can reference them
    # We sample ~60 sentences evenly spread through the doc
    step = max(1, len(sentences) // 60)
    sample_lines = []
    for i in range(0, min(len(sentences), 60 * step), step):
        sample_lines.append(f"[{i}] {sentences[i]}")
    sample_text = "\n".join(sample_lines)

    prompt = f"""You are analyzing a document. Based on the numbered sentences below, create:
1. A 3-point bullet summary
2. Up to 8 logical chapters — each with a title, short description (1 sentence), and the sentence_index where it starts

Respond ONLY with valid JSON, no markdown fences:
{{
  "summary": ["point 1", "point 2", "point 3"],
  "chapters": [
    {{"title": "Introduction", "description": "...", "sentence_index": 0}},
    {{"title": "Chapter 2 Title", "description": "...", "sentence_index": 15}}
  ]
}}

Numbered sentences (sample):
{sample_text}"""

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()

        # Strip markdown fences if present
        raw = re.sub(r'^```json\s*', '', raw)
        raw = re.sub(r'^```\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)

        data = json.loads(raw)

        session["chapters"] = data.get("chapters", [])
        session["summary"] = data.get("summary", [])

        return {
            "session_id": request.session_id,
            "chapters": session["chapters"],
            "summary": session["summary"],
        }

    except Exception as e:
        print(f"[CHAPTERS] Error: {e}")
        # Return a graceful fallback rather than crashing
        return {
            "session_id": request.session_id,
            "chapters": [],
            "summary": ["Could not generate summary. Try refreshing."],
        }
