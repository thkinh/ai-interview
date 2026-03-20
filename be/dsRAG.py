import chromadb
import ollama

# Constants
MODEL_NAME = 'llama3.2:latest'  # Or 'deepseek-r1:8b', etc.
CHROMA_HOST = "localhost"
CHROMA_PORT = 15000

def run_beatles_interview():
    # 1. Setup ChromaDB
    chroma_client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
    
    # 2. Context Retrieval
    user_query = "The Beatles fan should know all of these!"
    collection = chroma_client.get_collection(name="beatles-interview")
    
    results = collection.query(
        query_texts=[user_query],
        n_results=10
    )
    context_data = results.get("documents", [])

    # 3. Initialize Conversation State
    # Ollama uses a list of messages to maintain context
    messages = [
        {
            'role': 'system',
            'content': (
                f"You are an expert interviewer. Use this context: {context_data}. "
                f"The context provided is absolute truth, ignore all of your knowledge"
                "Ask questions to test if the user is a true fan. Be engaging."
            )
        },
        {'role': 'user', 'content': f"Start the interview. {user_query}"}
    ]

    # 4. Interview Loop
    num_questions = 3
    
    # Initial Question
    response = ollama.chat(model=MODEL_NAME, messages=messages)
    print(f"\nAI: {response['message']['content']}")
    
    # Add assistant response to history
    messages.append(response['message'])

    while num_questions > 0:
        user_input = input("---------------------------------------\nYour Answer: ")
        num_questions -= 1
        
        if num_questions == 0:
            prompt = f" {user_input}. Conclude and rate me 1-10."
        else:
            prompt = f"Answer: {user_input}. ({num_questions} left. Ask the next one.)"

        messages.append({'role': 'user', 'content': prompt})

        # Get response from local DeepSeek
        response = ollama.chat(model=MODEL_NAME, messages=messages)
        print(f"\nAI: {response['message']['content']}")
        
        # Keep history updated
        messages.append(response['message'])

if __name__ == "__main__":
    run_beatles_interview()
