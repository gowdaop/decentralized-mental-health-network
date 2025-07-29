#!/usr/bin/env python3
import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000"
token = None
commitment = None

def test_health_check():
    print("🏥 Testing Health Check...")
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    print("✅ Health check passed")

def test_user_registration():
    global token, commitment
    print("👤 Testing User Registration...")
    
    data = {
        "age_range": "25-35",
        "topics": "anxiety, depression",
        "severity_level": "moderate",
        "preferred_times": ["morning", "evening"]
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=data)
    assert response.status_code == 200
    
    result = response.json()
    token = result['access_token']
    commitment = result['commitment']
    
    print(f"✅ User registered. Commitment: {commitment[:16]}...")

def test_mood_recording():
    print("🧠 Testing Mood Recording...")
    
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "score": 7,
        "description": "Feeling good today",
        "triggers": "good weather",
        "notes": "positive mood"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/mood/record", 
                           json=data, headers=headers)
    assert response.status_code == 200
    print("✅ Mood recorded successfully")

def test_mood_analytics():
    print("📊 Testing Mood Analytics...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/v1/mood/analysis?days=7", 
                          headers=headers)
    assert response.status_code == 200
    print("✅ Mood analytics retrieved")

def test_reputation():
    print("⭐ Testing Reputation System...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/v1/auth/user/{commitment}/reputation", 
                          headers=headers)
    assert response.status_code == 200
    print("✅ Reputation retrieved")

def run_all_tests():
    try:
        test_health_check()
        test_user_registration()
        time.sleep(1)  # Allow blockchain transaction to process
        test_mood_recording()
        test_mood_analytics()
        test_reputation()
        
        print("\n🎉 ALL TESTS PASSED! 🎉")
        print(f"User Token: {token[:20]}...")
        print(f"User Commitment: {commitment}")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_all_tests()
