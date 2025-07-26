import os
from web3 import Web3
from app.blockchain.web3client import web3, get_user_registry_contract, get_token_system_contract
from typing import Optional, Dict

class BlockchainService:
    def __init__(self):
        self.web3 = web3
        self.user_registry = get_user_registry_contract()
        self.token_system = get_token_system_contract()
        self.private_key = os.environ["PRIVATE_KEY"]
        self.account = self.web3.eth.account.from_key(self.private_key)

    def register_user_commitment(self, commitment_hex: str) -> Optional[Dict]:
        """Register user commitment on blockchain"""
        try:
            print(f"🔗 Registering commitment: {commitment_hex}")
            
            # Convert hex string to bytes32
            commitment_bytes = Web3.to_bytes(hexstr=commitment_hex)
            
            # Build transaction
            txn = self.user_registry.functions.registerUser(commitment_bytes).build_transaction({
                'from': self.account.address,
                'nonce': self.web3.eth.get_transaction_count(self.account.address),
                'gas': 200000,
                'gasPrice': self.web3.to_wei('20', 'gwei')
            })
            
            # Sign transaction
            signed_txn = self.account.sign_transaction(txn)
            
            # Send transaction (using correct attribute for Web3.py v6+)
            tx_hash = self.web3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            # Wait for transaction receipt
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            print(f"✅ Transaction confirmed: Block {receipt['blockNumber']}")
            
            return {
                'tx_hash': self.web3.to_hex(tx_hash),
                'block_number': receipt['blockNumber'],
                'gas_used': receipt['gasUsed'],
                'status': receipt['status']
            }
        except Exception as e:
            print(f"❌ Blockchain registration error: {e}")
            return None

    def get_user_reputation(self, commitment_hex: str) -> int:
        """Get user reputation from blockchain"""
        try:
            # Validate and format hex string
            if not commitment_hex.startswith('0x'):
                commitment_hex = '0x' + commitment_hex
                
            commitment_bytes = Web3.to_bytes(hexstr=commitment_hex)
            user_data = self.user_registry.functions.users(commitment_bytes).call()
            
            # Return reputation field (index 1 in the struct)
            return user_data[1]
        except ValueError as e:
            print(f"Invalid commitment format: {e}")
            return 0
        except Exception as e:
            print(f"Error getting user reputation: {e}")
            return 0

    def check_user_exists(self, commitment_hex: str) -> bool:
        """Check if user commitment exists on blockchain"""
        try:
            # Validate and format hex string
            if not commitment_hex.startswith('0x'):
                commitment_hex = '0x' + commitment_hex
                
            commitment_bytes = Web3.to_bytes(hexstr=commitment_hex)
            user_data = self.user_registry.functions.users(commitment_bytes).call()
            
            # Return active field (index 3 in the struct)
            return user_data[3]
        except ValueError as e:
            print(f"Invalid commitment format: {e}")
            return False
        except Exception as e:
            print(f"Error checking user existence: {e}")
            return False

    def reward_user(self, user_address: str, amount: int) -> Optional[str]:
        """Reward user with tokens"""
        try:
            txn = self.token_system.functions.reward(
                Web3.to_checksum_address(user_address), 
                amount
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.web3.eth.get_transaction_count(self.account.address),
                'gas': 100000,
                'gasPrice': self.web3.to_wei('20', 'gwei')
            })
            
            signed_txn = self.account.sign_transaction(txn)
            tx_hash = self.web3.eth.send_raw_transaction(signed_txn.raw_transaction)
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            return self.web3.to_hex(tx_hash)
        except Exception as e:
            print(f"Token reward error: {e}")
            return None
