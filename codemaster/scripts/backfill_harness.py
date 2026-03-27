import os
import sys

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db.database import SessionLocal
from backend.models import Problem
from backend.services import harness_service

def backfill():
    db = SessionLocal()
    try:
        problems = db.query(Problem).all()
        print(f"Found {len(problems)} problems to backfill.")
        
        for p in problems:
            print(f"Processing '{p.title}' (ID: {p.id})...")
            
            # Reconstruct problem data for harness generator
            data = {
                "title": p.title,
                "description": p.description,
                "examples": p.examples or [],
                "constraints": p.constraints or ""
            }
            
            boilerplate = p.boilerplate or {}
            harness = p.harness or {}
            
            for lang in ["cpp", "python", "java", "javascript"]:
                if lang not in harness or not harness[lang]:
                    print(f"  Generating harness for {lang}...")
                    h = harness_service.generate_harness(data, lang)
                    if h.get("starter"):
                        boilerplate[lang] = h["starter"]
                    if h.get("harness"):
                        harness[lang] = h["harness"]
            
            p.boilerplate = boilerplate
            p.harness = harness
            db.commit()
            print(f"  Done '{p.title}'")
            
    finally:
        db.close()

if __name__ == "__main__":
    backfill()
