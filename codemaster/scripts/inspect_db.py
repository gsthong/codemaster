import os
import sys
# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db.database import SessionLocal
from backend.models import Problem

def check_db():
    db = SessionLocal()
    try:
        p = db.query(Problem).first()
        if p:
            print(f"Problem: {p.title}")
            harness = p.harness or {}
            print(f"Harness Keys: {list(harness.keys())}")
            cpp = harness.get('cpp', '')
            print("-" * 40)
            print("CPP HARNESS CONTENT:")
            print(cpp)
            print("-" * 40)
        else:
            print("No problems found in DB.")
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
