print("Starting import test...")

try:
    print("Importing FastAPI...")
    from fastapi import FastAPI
    print("✓ FastAPI imported successfully")
    
    print("Importing SQLAlchemy...")
    from sqlalchemy import create_engine
    print("✓ SQLAlchemy imported successfully")
    
    print("Importing our models...")
    from app.models.database import Base, get_db, engine
    print("✓ Database models imported successfully")
    
    print("Importing address book models...")
    from app.models.address_book import CommonID, Contact
    print("✓ Address book models imported successfully")
    
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")
    
    print("\n=== All imports successful! ===")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
