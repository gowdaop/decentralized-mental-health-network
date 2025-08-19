import pytest
from sqlalchemy import create_engine, text
from app.core.config import settings

# Create a new database engine using the PostgreSQL connection string
engine = create_engine(settings.DATABASE_URL)

def test_read_users_from_postgres():
    """
    This test connects to the PostgreSQL database and verifies that it can read data
    from the 'users' table, which should have been migrated from SQLite.
    """
    try:
        with engine.connect() as connection:
            # Execute a simple query to fetch the first 5 users
            result = connection.execute(text("SELECT * FROM users LIMIT 5"))
            users = result.fetchall()

            # Assert that we got some users back
            assert len(users) > 0, "No users found in the database. The migration might have failed or the table is empty."

            print(f"Successfully fetched {len(users)} users from the PostgreSQL database:")
            for user in users:
                print(user)

    except Exception as e:
        pytest.fail(f"Failed to connect to the PostgreSQL database or read data. Error: {e}")
