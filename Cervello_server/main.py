from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse
import shutil
import os
from Embeddings_query import handle_file_upload

app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload/")
async def upload_file(
    file: UploadFile,
    source_url: str = Form(...),
    author: str = Form(...)
):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        result = handle_file_upload(file_location, source_url, author)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
