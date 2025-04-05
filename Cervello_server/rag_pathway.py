# main.py

import os
import pathway as pw
from pathway.stdlib.indexing.nearest_neighbors import BruteForceKnnFactory
from pathway.xpacks.llm import llms
from pathway.xpacks.llm.document_store import DocumentStore
from pathway.xpacks.llm.embedders import OpenAIEmbedder
from pathway.xpacks.llm.parsers import UnstructuredParser
from pathway.xpacks.llm.splitters import TokenCountSplitter

# Load OpenAI API key
OPENAI_API_KEY = "" 

# Step 1: Ingest PDF documents
documents = pw.io.fs.read("./data/", format="binary", with_metadata=True)

# Step 2: Define DocumentStore components
text_splitter = TokenCountSplitter(
    min_tokens=100, max_tokens=500, encoding_name="cl100k_base"
)
embedder = OpenAIEmbedder(api_key=OPENAI_API_KEY)
retriever_factory = BruteForceKnnFactory(embedder=embedder)
parser = UnstructuredParser(
    chunking_mode="by_title",
    chunking_kwargs={"max_characters": 3000, "new_after_n_chars": 2000},
)

# Step 3: Create the DocumentStore
document_store = DocumentStore(
    docs=documents,
    retriever_factory=retriever_factory,
    parser=parser,
    splitter=text_splitter,
)

# Step 4: Start HTTP server to receive queries
webserver = pw.io.http.PathwayWebserver(host="0.0.0.0", port=8011)

class QuerySchema(pw.Schema):
    messages: str

queries, writer = pw.io.http.rest_connector(
    webserver=webserver,
    schema=QuerySchema,
    autocommit_duration_ms=50,
    delete_completed_queries=False,
)

# Step 5: Prepare user queries for retrieval
queries = queries.select(
    query=pw.this.messages,
    k=1,
    metadata_filter=None,
    filepath_globpattern=None,
)

# Step 6: Retrieve documents using DocumentStore
retrieved_documents = document_store.retrieve_query(queries)
retrieved_documents = retrieved_documents.select(docs=pw.this.result)
queries_context = queries + retrieved_documents

# Step 7: Build context and prompts
def get_context(documents):
    content_list = []
    for doc in documents:
        content_list.append(str(doc["text"]))
    return " ".join(content_list)


@pw.udf
def build_prompts_udf(documents, query) -> str:
    context = get_context(documents)
    return f"Given the following documents:\n{context}\nAnswer this query: {query}"

prompts = queries_context + queries_context.select(
    prompts=build_prompts_udf(pw.this.docs, pw.this.query)
)

# Step 8: Define OpenAI model
model = llms.OpenAIChat(
    model="gpt-4o-mini",
    api_key=OPENAI_API_KEY,
)

# Step 9: Generate answers using OpenAI
responses = prompts.select(
    *pw.this.without(pw.this.query, pw.this.prompts, pw.this.docs),
    result=model(llms.prompt_chat_single_qa(pw.this.prompts)),
)

# Step 10: Send responses back
writer(responses)

# Step 11: Run the pipeline
pw.run()

