import urllib.request
import json

api_key = "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"

# Minimal valid PNG base64
img_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAADklEQVQI12P4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg=="

data = json.dumps({
    "model": "claude-opus-4-6",
    "max_tokens": 100,
    "messages": [{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": img_b64
                }
            },
            {"type": "text", "text": "Describe this image in one word."}
        ]
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
        print("Vision works:", result["content"][0]["text"])
except urllib.error.HTTPError as e:
    print("Error:", e.code, e.read().decode())
