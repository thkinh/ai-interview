from os import read
import sys
import chromadb

CHROMA_HOST='localhost'
CHROMA_PORT=15000


def readFile():
    if len(sys.argv) < 2:
        print("Usage: python regisData.py <file_path>")
        sys.exit(1)
    file_path = sys.argv[1]
    file_name = file_path.strip().split("-")

    try:
        with open(file_path, "r") as f:
            knowledges = []
            for line in f:
                knowledges.append(line.rstrip())
            return knowledges, file_name
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return [], file_name   # 👈 return something valid
    except Exception as e:
        print(f"Error: {e}")
        return [], file_name   # 👈 same here


def regisData(client, knowledges, tableName):
    # delete old collection if exists
    try:
        client.delete_collection(name=tableName)
    except Exception:
        pass
    collection = client.create_collection(name=tableName)

    ids = []
    documents = []
    metadatas = []
    for i, line in enumerate(knowledges):
        parts = line.split("|")
        if len(parts) == 3:
            type_, name, content = parts
            documents.append(content.strip())
            metadatas.append({
                "type": type_.strip(),
                "name": name.strip()
            })
        else:
            # fallback if format is not correct
            documents.append(line.strip())
            metadatas.append({
                "type": "general"
            })
        ids.append(str(i + 1))
    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )
    print(f"Registered {len(documents)} documents into '{tableName}'")

if __name__ == "__main__":
    knowledges, file_name = readFile()
    tableName = file_name[0] + "-interview" #ex: linux-interview
    print(tableName)

    client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
    regisData(client, knowledges, tableName)

    collection = client.get_collection(tableName)
    results = collection.query(
        query_texts=["Concepts"],
        n_results=10
    )['documents'][0]

    for result in results:
        print(result)

