import pathway as pw
from pathway.xpacks.llm import llms
from agentic_rag_assistant.ingest_docs import build_document_store

import os
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

store = build_document_store()
model = llms.OpenAIChat(model="gpt-4o-mini", api_key=OPENAI_API_KEY)

class InputSchema(pw.Schema):
    query: str
    k: int
    metadata_filter: str | None
    filepath_globpattern: str | None


@pw.udf
def build_prompt(docs, query):
    context = "\n".join([doc["text"] for doc in docs])
    return f"Given the documents:\n{context}\nAnswer the following query: {query}"

def answer_query(query: str):
    table = pw.debug.table_from_rows(
    rows=[(query, 3, None, None)],
    schema=InputSchema
)
    retrieved = store.retrieve_query(table).select(docs=pw.this.result)
    context_table = table + retrieved

    prompts = context_table.select(prompts=build_prompt(pw.this.docs, pw.this.query))
    results = prompts.select(response=model(llms.prompt_chat_single_qa(pw.this.prompts)))

    return results

