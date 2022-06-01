//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "./interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IUniswapV2Router02.sol";

contract ACDMPlatform is ReentrancyGuard, AccessControl {
    enum roundState { DEFAULT, SALE, TRADE}
    roundState round;

    struct SaleInfo{
        uint256 startTime;
        uint256 lastsUntil;
        uint256 amountOfTokensOnSale;// 1 eth 
        uint256 tokenPriceOnSale;//0.00001 eth
    }

    SaleInfo saleRound;

    struct TradeInfo{
        uint256 startTime;
        uint256 lastsUntil;
        uint256 tradeVolume;
    }
    TradeInfo tradeRound;

    struct Order{
        uint256 amount;
        uint256 price;
        address owner;
    }

    struct User{
        address referrer;
        bool isRegistered;
    }

    mapping (address => User) public referals;
    mapping (address => bool) public isRegistered;
    mapping (uint256 => Order) public orderInfo;

    address owner;
    address XXXToken;

    address ACDMToken;
    uint256 public comissionAccount;

    uint256 tokenPriceOnSale;
    uint256 roundTime;
    uint256 salePercentFirstRefer;
    uint256 salePercentSecondRefer;
    uint256 tradePercentFirstRefer;
    uint256 tradePercentSecondRefer;

    uint256 orderId;
    uint256 percentPrecision;

    bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");

    event saleRoundStarted(uint256 amountOfTokens, uint256 price);
    event userBoughtTokens(address user, uint256 amount);
    event tradeRoundStarted();
    event userAddNewOrder(address userAddress, uint256 id, uint amount, uint price);
    event userRemoveOrder(uint256 id);
    event userReedemOrder(address userAddress, uint256 id, uint amount);

    function setReferrersPercents(uint256 sale1Percent, uint256 sale2Percent, uint256 trade1Percent, uint256 trade2Percent, uint256 precision) external onlyRole(DAO_ROLE){
        salePercentFirstRefer = sale1Percent;
        salePercentSecondRefer = sale2Percent;
        tradePercentFirstRefer = trade1Percent;
        tradePercentSecondRefer = trade2Percent;
        percentPrecision = precision;
    }

    function getFirstSaleReferrerPercents() external view returns(uint256){
        return salePercentFirstRefer;
    }

    constructor(address _ACDMToken, address _XXXToken, uint256 _roundTime, uint256 _salePercentFirstRefer, uint256 _salePercentSecondRefer, uint256 _tradePercentFirstRefer, uint256 _tradePercentSecondRefer, uint256 precision) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        owner = msg.sender;
        ACDMToken = _ACDMToken;
        XXXToken = _XXXToken;
        roundTime = _roundTime;
        tradeRound.tradeVolume = 1e18; //1 ETH
        salePercentFirstRefer = _salePercentFirstRefer;
        salePercentSecondRefer = _salePercentSecondRefer;
        tradePercentFirstRefer = _tradePercentFirstRefer;
        tradePercentSecondRefer = _tradePercentSecondRefer;
        percentPrecision = precision;
        referals[msg.sender].referrer = address(this);
        referals[msg.sender].isRegistered = true;
    }

    function register(address referrer) external{
        require(referals[referrer].isRegistered , "Referrer not regestered");
        referals[msg.sender].referrer = referrer;
        referals[msg.sender].isRegistered = true;
    }

    function startSaleRound() external{
        require(round != roundState.SALE, "Sale round already started");
        require(tradeRound.lastsUntil<block.timestamp, "Trade round hasn't been finished yet");
        saleRound.tokenPriceOnSale = saleRound.lastsUntil == 0 ? 1e13 : saleRound.tokenPriceOnSale+(saleRound.tokenPriceOnSale/100*3) + 4000000000000;
        saleRound.amountOfTokensOnSale = tradeRound.tradeVolume/saleRound.tokenPriceOnSale; // trade volume / current sale price
        IERC20(ACDMToken).mint(address(this), saleRound.amountOfTokensOnSale);
        saleRound.lastsUntil = block.timestamp + roundTime;
        round = roundState.SALE;
        emit saleRoundStarted(saleRound.amountOfTokensOnSale, saleRound.tokenPriceOnSale);
    }

    function buyACDM(uint256 amount) external payable{
        require (block.timestamp < saleRound.lastsUntil, "Time of sale's round is over");
        require(round == roundState.SALE, "You can't buy tokens now, sale round hasn't been started yet");
        require(msg.value >= saleRound.tokenPriceOnSale * amount, "Not enough ether");
        require(saleRound.amountOfTokensOnSale > 0, "There's no token left, you can start trade round");
        require(saleRound.amountOfTokensOnSale >= amount, "Not enough tokens left");
        IERC20(ACDMToken).transfer(msg.sender, amount);
        saleRound.amountOfTokensOnSale-=amount;
        if (referals[msg.sender].isRegistered){
            (bool success1, ) = referals[msg.sender].referrer.call{value: (saleRound.tokenPriceOnSale * amount / percentPrecision * salePercentFirstRefer)}("");
            (bool success2, ) = referals[referals[msg.sender].referrer].referrer.call{value: (saleRound.tokenPriceOnSale * amount / percentPrecision * salePercentSecondRefer)}("");
        }
        emit userBoughtTokens(msg.sender, amount);
    }

    function startTradeRound() external{
        require(round != roundState.DEFAULT, "Sale round should start first");
        require(round != roundState.TRADE, "Trade round has been already started");
        require(saleRound.lastsUntil<block.timestamp || saleRound.amountOfTokensOnSale==0, "Sale round hasn't finished yet");
        tradeRound.tradeVolume = 0;
        IERC20(ACDMToken).burn(address(this), saleRound.amountOfTokensOnSale);
        saleRound.amountOfTokensOnSale = 0;
        tradeRound.lastsUntil = block.timestamp + roundTime;
        round = roundState.TRADE;
        emit tradeRoundStarted();
    }

    function addOrder(uint256 _amount, uint256 _price) external{
        require(round == roundState.TRADE, "You can't add order now, trade round hasn't been started yet");
        require(block.timestamp < tradeRound.lastsUntil, "Time of trade's round is over");
        IERC20(ACDMToken).transferFrom(msg.sender, address(this), _amount);
        orderInfo[orderId].owner = msg.sender;
        orderInfo[orderId].amount = _amount;
        orderInfo[orderId].price = _price;
        emit userAddNewOrder(msg.sender, orderId, _amount, _price);
        orderId++;
    }

    function removeOrder(uint256 ordrId) external{
        require(round == roundState.TRADE, "You can't remove order now, trade round hasn't been started yet");
        require(block.timestamp < tradeRound.lastsUntil, "Time of trade's round is over");
        require(orderInfo[ordrId].owner!=address(0), "That order doesn't exist");
        require(msg.sender == orderInfo[ordrId].owner, "Sender is not an owner of this order");
        require(orderInfo[ordrId].amount > 0, "All tokens from order are already sold");
        
        IERC20(ACDMToken).transfer(msg.sender, orderInfo[ordrId].amount);
        orderInfo[ordrId].amount = 0;
        emit userRemoveOrder(ordrId);
    }

     function redeemOrder(uint256 ordrId, uint256 amnt) external nonReentrant() payable {
        require(round == roundState.TRADE, "You can't redeem order now, trade round hasn't been started yet");
        require(block.timestamp < tradeRound.lastsUntil, "Time of trade's round is over");
        require(orderInfo[ordrId].owner!=address(0), "That order doesn't exist");
        require(orderInfo[ordrId].amount >= amnt, "There isn't enough token left");
        require(msg.value >= orderInfo[ordrId].price * amnt, "Not enough ether");
        
        IERC20(ACDMToken).transfer(msg.sender, amnt);
        payable(orderInfo[ordrId].owner).transfer(msg.value / percentPrecision * (percentPrecision - tradePercentFirstRefer - tradePercentSecondRefer)); // % to owner = 100% - % for referrals
        orderInfo[ordrId].amount-= amnt;
        emit userReedemOrder(msg.sender, ordrId, amnt);
        if (referals[msg.sender].isRegistered){
            referals[msg.sender].referrer.call{value: (msg.value / percentPrecision * tradePercentFirstRefer)}("");
            referals[referals[msg.sender].referrer].referrer.call{value: (msg.value / percentPrecision * tradePercentSecondRefer)}("");

        }
        else{
            comissionAccount+=msg.value / percentPrecision * (tradePercentFirstRefer+tradePercentSecondRefer);
        }
        tradeRound.tradeVolume+=msg.value;
    }

    function sendComissionToOwner() external onlyRole(DAO_ROLE){
        owner.call{value: comissionAccount}("");
        comissionAccount=0;
    }

    function buyXXXandBurn() external onlyRole(DAO_ROLE){
        address weth = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
        address uniswap = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        address[] memory path = new address[](2); 
        path[0] = weth;
        path[1] = XXXToken;
        uint256[] memory amount = IUniswapV2Router02(uniswap).swapExactETHForTokens{value: comissionAccount}(0, path, address(this), block.timestamp + 120);

        IERC20(XXXToken).burn(address(this), amount[1]);
        comissionAccount=0;
    }

}
