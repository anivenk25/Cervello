import os
from dotenv import load_dotenv
import pathway as pw
from pathway.stdlib.indexing.nearest_neighbors import BruteForceKnnFactory
from pathway.xpacks.llm.embedders import OpenAIEmbedder
from pathway.xpacks.llm.parsers import UnstructuredParser
from pathway.xpacks.llm.splitters import TokenCountSplitter
from pathway.xpacks.llm.document_store import DocumentStore

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def build_document_store():
    documents = pw.io.fs.read("./data/", format="binary", with_metadata=True)

    parser = UnstructuredParser(
        chunking_mode="by_title",
        chunking_kwargs={"max_characters": 3000, "new_after_n_chars": 2000},
    )
    splitter = TokenCountSplitter(min_tokens=100, max_tokens=500, encoding_name="cl100k_base")
    embedder = OpenAIEmbedder(api_key=OPENAI_API_KEY)
    retriever = BruteForceKnnFactory(embedder=embedder)

    store = DocumentStore(
        docs=documents,
        retriever_factory=retriever,
        parser=parser,
        splitter=splitter,
    )
    return store

