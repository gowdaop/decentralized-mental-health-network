// contracts/TokenSystem.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TokenSystem {
    string public name = "SupportToken";
    string public symbol = "SPT";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balances;

    event Reward(address indexed recipient, uint256 amount);

    function reward(address recipient, uint256 amount) external {
        balances[recipient] += amount;
        totalSupply += amount;
        emit Reward(recipient, amount);
    }
}
