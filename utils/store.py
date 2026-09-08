import os
import json

# Local filesystem storage - persists across sandbox restarts
PROJECT_DIR = os.path.join(os.path.dirname(__file__), "..", "projects")


def get_store_path(id: str, filename: str):
    """Get local filesystem store path"""
    project_path = os.path.join(PROJECT_DIR, id)
    os.makedirs(project_path, exist_ok=True)
    return os.path.join(project_path, filename)


def save_json_store(id: str, filename: str, data: dict or list):
    """Save data to local filesystem"""
    try:
        file_path = get_store_path(id, filename)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved {filename} to local filesystem for project {id}")
    except Exception as e:
        print(f"Error saving {filename} for project {id}: {e}")


def load_json_store(id: str, filename: str):
    """Load data from local filesystem"""
    try:
        file_path = get_store_path(id, filename)
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading {filename} for project {id}: {e}")

    return {} if filename.endswith(".json") else []
