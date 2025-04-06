from qdrant_client import QdrantClient

qdrant_client = QdrantClient(
    url="https://d91ad594-37e2-4e89-8010-be8495bea5e0.us-west-1-0.aws.cloud.qdrant.io:6333",
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.qxTbSwgYTXKgTrUckUEOr6XD1ieHln8PoqUf28Y2bHg",
)

# Specify the collection name
collection_name = "my_collection"  # Replace with the actual collection name

# Check if the collection exists
if qdrant_client.collection_exists(collection_name):
    # Retrieve data from the collection
    response = qdrant_client.scroll(collection_name=collection_name, limit=10)
    points = response[0]  # The first element contains the points
    print(f"Data in collection '{collection_name}':")
    for point in points:
        print(point)
else:
    print(f"Collection '{collection_name}' does not exist.")