import sys
import os
sys.path.append('.')

from app.services.blockchain_service import BlockchainService
from dotenv import load_dotenv

load_dotenv()

def test_blockchain_connection():
    """Test basic blockchain connection"""
    try:
        blockchain = BlockchainService()
        print("✅ BlockchainService initialized")
        
        # Test web3 connection
        latest_block = blockchain.web3.eth.block_number
        print(f"✅ Connected to blockchain. Latest block: {latest_block}")
        
        # Test contract loading
        print(f"✅ UserRegistry contract: {blockchain.user_registry.address}")
        print(f"✅ TokenSystem contract: {blockchain.token_system.address}")
        
        return True
    except Exception as e:
        print(f"❌ Blockchain connection failed: {e}")
        return False

if __name__ == "__main__":
    test_blockchain_connection()
