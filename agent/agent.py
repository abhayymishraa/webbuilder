import os
import httpx
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from .usage import capture_provider_usage
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
    http_async_client=httpx.AsyncClient(event_hooks={'response': [capture_provider_usage]}),
)
