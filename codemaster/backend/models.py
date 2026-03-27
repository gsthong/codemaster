from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .db.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="student")
    streak = Column(Integer, default=0)
    last_active = Column(DateTime, default=datetime.utcnow)
    wecode_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submissions = relationship("Submission", back_populates="user")
    hint_usages = relationship("HintUsage", back_populates="user")

class Problem(Base):
    __tablename__ = "problems"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    difficulty = Column(String) # easy, medium, hard
    tags = Column(JSON, default=list) # ["Array", "Graph"]
    examples = Column(JSON, default=list) # [{"input": "...", "output": "..."}]
    constraints = Column(Text, nullable=True)
    acceptance = Column(Float, default=0.0)
    syllabus_topic = Column(String, nullable=True) # Topic in coursce syllabus
    time_limit = Column(Float, default=2.0)
    memory_limit = Column(Integer, default=256)
    
    # NEW: For LeetCode-style snippets
    boilerplate = Column(JSON, default=dict) # {"cpp": "...", "python": "..."}
    harness = Column(JSON, default=dict)     # {"cpp": "...", "python": "..."}
    
    created_at = Column(DateTime, default=datetime.utcnow)

    testcases = relationship("TestCase", back_populates="problem", cascade="all, delete-orphan")

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    problem_id = Column(Integer, ForeignKey("problems.id"))
    code = Column(Text)
    language = Column(String)
    status = Column(String) # AC, WA, TLE, RE, CE, PENDING
    runtime_ms = Column(Float, default=0.0)
    test_results = Column(JSON, default=list) # [{"status": "AC", "input": "...", "output": "..."}]
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="submissions")
    problem = relationship("Problem")

class TestCase(Base):
    __tablename__ = "testcases"
    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"))
    input = Column(Text)
    expected_output = Column(Text)
    is_hidden = Column(Boolean, default=False)
    order = Column(Integer, default=0)

    problem = relationship("Problem", back_populates="testcases")

class HintUsage(Base):
    __tablename__ = "hint_usages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    problem_id = Column(Integer, ForeignKey("problems.id"))
    hint_level = Column(Integer) # 1, 2, 3
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="hint_usages")
    problem = relationship("Problem")

class Syllabus(Base):
    __tablename__ = "syllabuses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    topics = Column(JSON) # List of extracted topics
    raw_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
