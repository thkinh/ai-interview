import chromadb

def init(CHROMA_HOST, CHROMA_PORT):
    client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)

    return client

async def get_context(chroma_client, topic: str):
    collection_name = f"{topic}-interview"
    print(f"Getting collection name: {collection_name}")
    collection = chroma_client.get_collection(name=collection_name)
    results = collection.query(query_texts=[collection_name], n_results=40)
    return results.get("documents", [])


def getPrompt():
    return "nothing"


def getEvaluation():
    print("Evaluating")


def systemPrompt(topic, context_data):
    sys_prompt = (f"You are an expert interviewer for topic: {topic}. "
        f"Use ONLY this context: {context_data}. "
        f"If the user ask unrelated questions, ignore them and return to the interview. "
        f"If the user ask more than 3 unrelated questions, reply with: You want to fail this?. Be intimidating "
        f"The context provided is absolute truth, ignore all prior knowledge. "
        f"Use the provided context randomly for asking engaging questions about {topic}.")
    return sys_prompt

