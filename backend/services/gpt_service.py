import os
from typing import Dict

import openai
from openai import OpenAIError

# API key loaded from environment
openai.api_key = os.getenv("OPENAI_API_KEY")

async def generate_curl_example(context: Dict, user_query: str) -> str:
    """Generate a curl command example using GPT-4 based on the given context and user query."""
    prompt = (
        "Given the following context and user query, generate a well-formatted curl example:\n\n"
        f"Context: {context}\n"
        f"User query: {user_query}\n\n"
        "Curl example:"
    )
    try:
        response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=300,
        )
        return response.choices[0].message.content.strip()
    except OpenAIError as exc:
        # Return an error message that can be displayed to the user
        return f"Error generating example: {exc}"
