import pathway as pw
from agentic_rag_assistant.ingest_docs import build_document_store

store = build_document_store()

def retrieve_docs(query: str):
    @pw.udf
    def wrap_query():
        return {"query": query, "k": 3, "metadata_filter": None, "filepath_globpattern": None}

    input_table = pw.Table.from_rows([wrap_query()])
    results = store.retrieve_query(input_table).select(docs=pw.this.result)
    return results

