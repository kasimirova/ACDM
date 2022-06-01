// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IStaking {
    function stake(uint256 amount) external;

    function lpToken() external view returns(address);

    function claim() external;

    function unstake() external;
    
    function countReward(address _user) external view returns(uint256);

    function setRewardTime(uint256 newRewardTime) external;

    function setRewardPercent(uint8 newRewardPercent) external;

    function setFreezingTimeForLP(uint256 newFreezingTime) external;

    function getRewardDebt(address _user) external view returns(uint256);

    function getAmountofStakedTokens(address _user) external view returns(uint256);

    function addDaoAddress(address dao) external;

}
