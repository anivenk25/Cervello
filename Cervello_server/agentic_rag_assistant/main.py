from fastapi import FastAPI
from agentic_rag_assistant.schemas import QueryRequest, QueryResponse
from agentic_rag_assistant.rag_pipeline import answer_query

import pathway as pw

app = FastAPI()

@app.post("/query", response_model=QueryResponse)
def ask_rag(req: QueryRequest):
    query = req.query
    result_table = answer_query(query)
    
    # Run the Pathway pipeline to get result
    response_row = None
    def capture_output(table):
        nonlocal response_row
        for row in table:
            response_row = row

    pw.io.python.write(result_table, capture_output)
    pw.run()

    return QueryResponse(response=response_row["response"])

