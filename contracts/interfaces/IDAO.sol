// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IDAO {

   function addProposal(bytes memory _callData, address _recipient, string memory _description) external;

    function vote(uint256 id, bool _vote) external;

    function finishProposal(uint256 id) external;

    function countMinAmountOfVotes() external view returns(uint256);

    function callFunc(address recipient, bytes memory signature) external returns(bool);

    function getUsersDeposit(address userId) external view returns (uint256);

    function getFreezeUntillForUser(address userId) external view returns (uint256);

    function checkIfUserVoted(address userId, uint256 propId) external view returns (bool);

}
