import os
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables.")

llm = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-5.6-luna"),
    api_key=api_key,
    use_responses_api=True,
    output_version="v0",
    reasoning={"effort": "low"},
    max_tokens=8192,
    timeout=90,
    max_retries=1,
)
