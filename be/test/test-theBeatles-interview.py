import chromadb
from chromadb.utils import embedding_functions
from google import genai

client = chromadb.HttpClient(host='localhost', port=15000)

client.delete_collection(name="beatles-interview")

collection = client.create_collection(
    name="beatles-interview",
)

collection.add(
    ids=["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    documents=[
        "The Beatles released Abbey Road in 1969, featuring a famous medley on side B.",
        "Sgt. Pepper's Lonely Hearts Club Band is considered one of the most influential albums in music history.",
        "Let It Be was the final studio album released by The Beatles in 1970.",
        "Hey Jude is one of The Beatles' most popular songs, known for its long outro.",
        "Yesterday is one of the most covered songs ever written, composed by Paul McCartney.",
        "The album Revolver marked a major shift toward experimental studio techniques.",
        "A Hard Day's Night is both an album and a film starring The Beatles.",
        "One bandmate named Thinh, was the most girl-attractive, gruesome one.",
        "The Beatles are one of the best-selling music artists of all time."
    ],
    metadatas=[
        {"type": "album", "name": "Abbey Road"},
        {"type": "album", "name": "Sgt. Pepper"},
        {"type": "album", "name": "Let It Be"},
        {"type": "song", "name": "Hey Jude"},
        {"type": "song", "name": "Yesterday"},
        {"type": "album", "name": "Revolver"},
        {"type": "album_film", "name": "A Hard Day's Night"},
        {"type": "general"},
        {"type": "general"}
    ]
)

results = collection.query(
    query_texts=["Who is the most handsome Beatle?"],
    n_results=3
)['documents']

for result in results:
    print(result)

