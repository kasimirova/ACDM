//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IDAO.sol";

contract Staking is AccessControl{
    struct userInfo{
        uint256 amountofStakedLPTokens;
        uint256 timeOfStake;
        uint256 rewardDebt;
        uint256 freezeUntil;
    }

    mapping (address => userInfo) public user;
    address public ownerAddress;
    address public lpToken;
    address public rewardToken;
    address public daoAddress;

    uint256 public freezingTimeForLP;
    uint256 public rewardTime;
    uint8 public percent;

    bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");

    constructor(address _lpToken, address _rewardToken, uint256 _freezingTimeForLP, uint256 _rewardTime, uint8 _percent) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        ownerAddress = msg.sender;
        lpToken = _lpToken;
        rewardToken = _rewardToken;
        freezingTimeForLP = _freezingTimeForLP;
        rewardTime = _rewardTime;
        percent = _percent;
    }

    modifier onlyOwner(){
        require(msg.sender == ownerAddress, "Sender is not an owner");
        _;
    }

    function stake(uint256 amount) external{
        if (user[msg.sender].amountofStakedLPTokens > 0){
            user[msg.sender].rewardDebt+=countReward(msg.sender);
        }
        user[msg.sender].amountofStakedLPTokens+=amount;
        user[msg.sender].timeOfStake = block.timestamp;
        user[msg.sender].freezeUntil = block.timestamp + freezingTimeForLP;
        IERC20(lpToken).transferFrom(msg.sender, address(this), amount);
    }

    function claim() external{
        IERC20(rewardToken).transfer(msg.sender, countReward(msg.sender)+user[msg.sender].rewardDebt);
        user[msg.sender].timeOfStake = block.timestamp;
        user[msg.sender].rewardDebt=0;
    }

    function unstake() external{
        require(block.timestamp >= user[msg.sender].freezeUntil, "It's too soon to unstake");
        require(block.timestamp >= IDAO(daoAddress).getFreezeUntillForUser(msg.sender), "You can't unstake now, not all proposals that you participate in are finished");

        IERC20(lpToken).transfer(msg.sender, user[msg.sender].amountofStakedLPTokens);
        user[msg.sender].rewardDebt+=countReward(msg.sender);      
        user[msg.sender].amountofStakedLPTokens = 0;
    }
    
    function countReward(address _user) public view returns(uint256) {
        return (block.timestamp - user[_user].timeOfStake)/rewardTime * user[_user].amountofStakedLPTokens/100*percent;
    }

    function setFreezingTimeForLP(uint256 newFreezingTime) external onlyRole(DAO_ROLE){
        freezingTimeForLP = newFreezingTime;
    }

    function getFreezingTimeForLP() external view returns(uint256) {
        return freezingTimeForLP;
    }

    function getAmountofStakedTokens(address _user) external view returns(uint256) {
        return user[_user].amountofStakedLPTokens;
    }

    function addDaoAddress(address dao) external onlyOwner {
        daoAddress = dao;
    }

}
