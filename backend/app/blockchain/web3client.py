import os
import json
from web3 import Web3
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

# Connect to Hardhat node
web3 = Web3(Web3.HTTPProvider(os.environ["WEB3_PROVIDER_URL"]))

def load_contract_abi(contract_name: str):
    """Load contract ABI from artifacts"""
    # Navigate from backend/app/blockchain/ to blockchain/artifacts/
    current_dir = Path(__file__).parent
    project_root = current_dir.parent.parent.parent
    artifacts_path = project_root / "blockchain" / "artifacts" / "contracts" / f"{contract_name}.sol" / f"{contract_name}.json"
    
    try:
        with open(artifacts_path, "r") as f:
            artifact = json.load(f)
            return artifact["abi"]
    except FileNotFoundError:
        raise FileNotFoundError(f"Contract artifact not found at {artifacts_path}")

def get_user_registry_contract():
    """Get UserRegistry contract instance"""
    abi = load_contract_abi("UserRegistry")
    address = os.environ["USER_REGISTRY_ADDRESS"]
    return web3.eth.contract(address=Web3.to_checksum_address(address), abi=abi)

def get_token_system_contract():
    """Get TokenSystem contract instance"""
    abi = load_contract_abi("TokenSystem")
    address = os.environ["TOKEN_SYSTEM_ADDRESS"]
    return web3.eth.contract(address=Web3.to_checksum_address(address), abi=abi)

# Test connection
try:
    print(f"✅ Connected to Web3. Latest block: {web3.eth.block_number}")
    user_registry = get_user_registry_contract()
    token_system = get_token_system_contract()
    print("✅ Smart contracts loaded successfully")
except Exception as e:
    print(f"❌ Web3 connection failed: {e}")
    user_registry = None
    token_system = None
