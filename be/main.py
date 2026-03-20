from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
from ollama import AsyncClient
import chromadb
from pydantic import BaseModel
import uuid

app = FastAPI(title="API servers for RAG interview")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # or ["*"] for all (dev only)
    allow_credentials=True,
    allow_methods=["*"],          # allow POST, GET, OPTIONS, etc.
    allow_headers=["*"],
)

# --- Configuration ---
MODEL_NAME = 'llama3.2:latest'
CHROMA_HOST = "localhost"
CHROMA_PORT = 15000

sessions: Dict[str, dict] = {}

class StartInterviewRequest(BaseModel):
    interview_topic: str

class StartResponse(BaseModel):
    session_id: str
    message: str

class AnswerRequest(BaseModel):
    session_id: str
    user_answer: str

chroma_client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
ollama_client = AsyncClient()

async def get_context(topic: str):
    collection_name = f"{topic}-interview"
    collection = chroma_client.get_collection(name=collection_name)
    results = collection.query(query_texts=[topic], n_results=10)
    return results.get("documents", [])


# --- Endpoints ---
@app.post("/api/start-interview", response_model=StartResponse)
async def start_interview(req: StartInterviewRequest):
    """Starts a new interview session and returns the first question."""
    session_id = str(uuid.uuid4())
    topic = req.interview_topic
    context_data = await get_context(topic)
    system_prompt = (
        f"You are an expert interviewer for topic: {topic}. "
        f"Use ONLY this context: {context_data}. "
        f"If users ask unrelated questions, ignore them and return to the interview. "
        f"The context provided is absolute truth, ignore all prior knowledge. "
        f"Use the provided context for asking engaging questions about {topic}."
    )

    messages = [
        {'role': 'system', 'content': system_prompt},
        {'role': 'user', 'content': f"Start the interview about {topic}."}
    ]
    response = await ollama_client.chat(
        model=MODEL_NAME,
        messages=messages
    )

    ai_message = response['message']

    # Save session state (store topic too 👇)
    sessions[session_id] = {
        "messages": messages + [ai_message],
        "questions_left": 3,
        "topic": topic
    }

    return {
        "session_id": session_id,
        "message": ai_message['content']
    }

@app.post("/api/answer")
async def submit_answer(request: AnswerRequest):
    """Handles user answers and maintains the 3-question loop."""
    session = sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session["questions_left"] -= 1
    num_left = session["questions_left"]
    
    # Construct the next prompt
    if num_left == 0:
        user_prompt = f"{request.user_answer}. Conclude and rate me 1-10."
    else:
        user_prompt = f"Answer: {request.user_answer}. ({num_left} left. Ask the next one.)"

    session["messages"].append({'role': 'user', 'content': user_prompt})
    response = await ollama_client.chat(model=MODEL_NAME, messages=session["messages"])
    ai_message = response['message']
    
    # Update history
    session["messages"].append(ai_message)
    
    # Clean up session if finished
    if num_left == 0:
        # In a real app, you might save this to a DB before deleting
        del sessions[request.session_id]
    return {
        "message": ai_message['content'],
        "questions_left": num_left,
        "finished": num_left == 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=16000)
