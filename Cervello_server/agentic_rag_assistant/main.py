from fastapi import FastAPI
from agentic_rag_assistant.schemas import QueryRequest, QueryResponse
from agentic_rag_assistant.rag_pipeline import answer_query

import pathway as pw
from pathway.io.python import ConnectorObserver

app = FastAPI()

class CaptureObserver(ConnectorObserver):
    def __init__(self):
        self.response_row = None

    def on_row(self, row: dict) -> None:
        # Optional: legacy support
        self.response_row = row

    def on_change(self, key, row: dict, time: int, is_addition: bool) -> None:
        if is_addition:
            self.response_row = row

@app.post("/query", response_model=QueryResponse)
def ask_rag(req: QueryRequest):
    query = req.query
    result_table = answer_query(query)

    observer = CaptureObserver()
    pw.io.python.write(result_table, observer=observer)
    pw.run()

    if observer.response_row is None:
        return QueryResponse(response="No result found.")
    
    return QueryResponse(response=observer.response_row["response"])

