import urllib.request
import json

api_key = "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"

data = json.dumps({
    "model": "claude-haiku-4-5-20251001",
    "max_tokens": 100,
    "messages": [{
        "role": "user",
        "content": "Say OK"
    }]
}).encode()

req = urllib.request.Request(
    "https://api.anthropic.com/v1/messages",
    data=data,
    headers={
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
)

try:
    with urllib.request.urlopen(req) as res:
        result = json.loads(res.read())
        print("API works:", result["content"][0]["text"])
except Exception as e:
    print("Error:", e)
