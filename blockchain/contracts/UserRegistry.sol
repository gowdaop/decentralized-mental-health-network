// contracts/UserRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UserRegistry {
    struct User {
        bytes32 commitment;
        uint256 reputation;
        uint256 joinDate;
        bool active;
    }
    
    mapping(bytes32 => User) public users;

    event UserRegistered(bytes32 indexed commitment);
    
    function registerUser(bytes32 _commitment) external {
        require(!users[_commitment].active, "User already registered");
        users[_commitment] = User(_commitment, 100, block.timestamp, true);
        emit UserRegistered(_commitment);
    }
}
