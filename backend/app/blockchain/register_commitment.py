from web3 import Web3
from app.blockchain.web3client import user_registry, web3
import os

def register_commitment_on_chain(commitment_hex: str):
    private_key = os.environ["PRIVATE_KEY"]
    account = web3.eth.account.from_key(private_key)

    txn = user_registry.functions.registerUser(Web3.to_bytes(hexstr=commitment_hex)).build_transaction({
        'from': account.address,
        'nonce': web3.eth.get_transaction_count(account.address),
        'gas': 200000,
        'gasPrice': web3.to_wei('20', 'gwei')
    })

    signed_tx = account.sign_transaction(txn)
    tx_hash = web3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return web3.to_hex(tx_hash)
