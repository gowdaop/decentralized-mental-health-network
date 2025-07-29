#!/usr/bin/env python3
"""Test script for database models."""

def test_models():
    try:
        from app.database import create_tables, engine
        from app.models.user import User, MoodEntry, PeerSession, SessionMatch
        
        print('✅ Models imported successfully')
        
        # Create tables
        create_tables()
        print('✅ Tables created successfully')
        
        # Check tables exist
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()
            tables = [row[0] for row in result]
            print(f'✅ Tables in database: {tables}')
            
        # Expected tables
        expected_tables = ['users', 'mood_entries', 'peer_sessions', 'session_matches']
        for table in expected_tables:
            if table in tables:
                print(f'✅ {table} table created')
            else:
                print(f'❌ {table} table missing')
                
    except Exception as e:
        print(f'❌ Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_models()
