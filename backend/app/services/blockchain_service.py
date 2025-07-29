import os
from web3 import Web3
from app.blockchain.web3client import web3, get_user_registry_contract, get_token_system_contract
from typing import Optional, Dict


class BlockchainService:
    def __init__(self):
        self.web3 = web3
        self.user_registry = get_user_registry_contract()
        self.token_system = get_token_system_contract()
        
        # ✅ Fix: Better environment variable handling
        self.private_key = os.getenv("PRIVATE_KEY", "0x" + "a" * 64)  # Fallback for testing
        
        # ✅ Fix: Validate private key format
        if not self.private_key.startswith('0x'):
            self.private_key = '0x' + self.private_key
            
        self.account = self.web3.eth.account.from_key(self.private_key)
        print(f"✅ Blockchain service initialized with account: {self.account.address}")

    def register_user_commitment(self, commitment_hex: str) -> Optional[Dict]:
        """Register user commitment on blockchain"""
        try:
            print(f"🔗 Registering commitment: {commitment_hex}")
            
            # ✅ Fix: Better hex string handling
            if commitment_hex.startswith('0x'):
                commitment_hex = commitment_hex[2:]  # Remove 0x prefix
            
            # Ensure it's exactly 64 characters (32 bytes)
            if len(commitment_hex) != 64:
                print(f"❌ Invalid commitment length: {len(commitment_hex)}, expected 64")
                return None
            
            # Convert hex string to bytes32
            commitment_bytes = Web3.to_bytes(hexstr='0x' + commitment_hex)
            
            # ✅ Fix: Add contract existence check
            if not self.user_registry:
                print("❌ User registry contract not available")
                return None
            
            # Build transaction
            txn = self.user_registry.functions.registerUser(commitment_bytes).build_transaction({
                'from': self.account.address,
                'nonce': self.web3.eth.get_transaction_count(self.account.address),
                'gas': 300000,  # ✅ Increased gas limit
                'gasPrice': self.web3.to_wei('20', 'gwei')
            })
            
            # Sign transaction
            signed_txn = self.account.sign_transaction(txn)
            
            # Send transaction
            tx_hash = self.web3.eth.send_raw_transaction(signed_txn.raw_transaction)
            print(f"📤 Transaction sent: {self.web3.to_hex(tx_hash)}")
            
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
            import traceback
            traceback.print_exc()
            return None

    def get_user_reputation(self, commitment_hex: str) -> int:
        """Get user reputation from blockchain"""
        try:
            # ✅ Fix: Standardize hex format
            if commitment_hex.startswith('0x'):
                commitment_hex = commitment_hex[2:]
            
            if len(commitment_hex) != 64:
                print(f"❌ Invalid commitment format for reputation lookup: {len(commitment_hex)}")
                return 100  # Default reputation
            
            # ✅ Fix: Add contract check
            if not self.user_registry:
                print("⚠️ User registry not available, returning default reputation")
                return 100
            
            commitment_bytes = Web3.to_bytes(hexstr='0x' + commitment_hex)
            
            # ✅ Fix: Better error handling for contract call
            try:
                user_data = self.user_registry.functions.users(commitment_bytes).call()
                print(f"📊 User data from blockchain: {user_data}")
                
                # Check if user exists (assuming index 3 is 'active' field)
                if len(user_data) > 3 and user_data[3]:  # User is active
                    reputation = user_data[1] if len(user_data) > 1 else 100
                    print(f"✅ Retrieved reputation: {reputation}")
                    return reputation
                else:
                    print("⚠️ User not found on blockchain, returning default")
                    return 100
                    
            except Exception as contract_error:
                print(f"⚠️ Contract call failed: {contract_error}")
                return 100
                
        except Exception as e:
            print(f"❌ Error getting user reputation: {e}")
            return 100  # ✅ Always return default instead of 0

    def check_user_exists(self, commitment_hex: str) -> bool:
        """Check if user commitment exists on blockchain"""
        try:
            # ✅ Fix: Standardize hex format
            if commitment_hex.startswith('0x'):
                commitment_hex = commitment_hex[2:]
            
            if len(commitment_hex) != 64:
                print(f"❌ Invalid commitment format for existence check: {len(commitment_hex)}")
                return False
            
            # ✅ Fix: Add contract check
            if not self.user_registry:
                print("⚠️ User registry not available")
                return False
            
            commitment_bytes = Web3.to_bytes(hexstr='0x' + commitment_hex)
            
            try:
                user_data = self.user_registry.functions.users(commitment_bytes).call()
                print(f"👤 User existence check: {user_data}")
                
                # Return active field (assuming index 3 is 'active')
                exists = len(user_data) > 3 and user_data[3]
                print(f"✅ User exists on chain: {exists}")
                return exists
                
            except Exception as contract_error:
                print(f"⚠️ Contract existence check failed: {contract_error}")
                return False
                
        except Exception as e:
            print(f"❌ Error checking user existence: {e}")
            return False

    def reward_user(self, user_address: str, amount: int) -> Optional[str]:
        """Reward user with tokens"""
        try:
            # ✅ Fix: Add contract check
            if not self.token_system:
                print("❌ Token system contract not available")
                return None
            
            # ✅ Fix: Validate address format
            try:
                checksum_address = Web3.to_checksum_address(user_address)
            except ValueError as e:
                print(f"❌ Invalid address format: {e}")
                return None
            
            txn = self.token_system.functions.reward(
                checksum_address, 
                amount
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.web3.eth.get_transaction_count(self.account.address),
                'gas': 100000,
                'gasPrice': self.web3.to_wei('20', 'gwei')
            })
            
            signed_txn = self.account.sign_transaction(txn)
            tx_hash = self.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            print(f"🎁 Token reward sent: {self.web3.to_hex(tx_hash)}")
            return self.web3.to_hex(tx_hash)
            
        except Exception as e:
            print(f"❌ Token reward error: {e}")
            import traceback
            traceback.print_exc()
            return None

    def get_service_status(self) -> Dict:
        """Get blockchain service status"""
        try:
            return {
                "web3_connected": self.web3.is_connected(),
                "latest_block": self.web3.eth.block_number,
                "account_address": self.account.address,
                "user_registry_available": self.user_registry is not None,
                "token_system_available": self.token_system is not None,
                "account_balance": self.web3.eth.get_balance(self.account.address)
            }
        except Exception as e:
            return {"error": str(e), "status": "unavailable"}
