// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "./IERC20.sol";



contract saveEtherERC20 {

    address savingToken;
    address owner;

    mapping(address => uint256) ethSavings;
    mapping(address => uint256) tokenSavings;


    event SavingSuccessful(address indexed user, uint256 indexed amount);
    event WithdrawSuccessful(address receiver, uint256 amount);


    constructor(address _savingToken) {
        savingToken = _savingToken;
        owner = msg.sender;
    }

    function depositEth() external payable {
        require(msg.sender != address(0), "wrong EOA");
        require(msg.value > 0, "can't save zero value");
        ethSavings[msg.sender] = ethSavings[msg.sender] + msg.value;
        emit SavingSuccessful(msg.sender, msg.value);
    }

    function depositToken(uint256 _amount) external {
        require(msg.sender != address(0), "address zero detected");
        require(_amount > 0, "can't save zero value");
        require(IERC20(savingToken).balanceOf(msg.sender) >= _amount, "not enough token");

        require(IERC20(savingToken).transferFrom(msg.sender, address(this), _amount), "failed to transfer");

        tokenSavings[msg.sender] += _amount;

        emit SavingSuccessful(msg.sender, _amount);

    }
    
    function withdrawEth() external {
        require(msg.sender != address(0), "wrong EOA");
        uint256 _userSavings = ethSavings[msg.sender];
        require(_userSavings > 0, "you don't have any saving in eth");

        ethSavings[msg.sender] -= _userSavings;

        payable(msg.sender).transfer(_userSavings);
    }

    function withdrawToken(uint256 _amount) external {
        require(msg.sender != address(0), "address zero detected");
        require(_amount > 0, "can't withdraw zero value");

        uint256 _userSaving = tokenSavings[msg.sender];

        require(_userSaving >= _amount, "insufficient funds");

        tokenSavings[msg.sender] -= _amount;

        require(IERC20(savingToken).transfer(msg.sender, _amount), "failed to withdraw");

        emit WithdrawSuccessful(msg.sender, _amount);
    }

    function checkEthSavings(address _user) external view returns (uint256) {
        return ethSavings[_user];
    }

    function checkTokenSavings(address _user) external view returns (uint256) {
        return tokenSavings[_user];
    }

    function sendOutEthSaving(address _receiver, uint256 _amount) external {
        require(msg.sender != address(0), "no zero address call");
        require(_amount > 0, "can't send zero value");
        require(ethSavings[msg.sender] >= _amount);
        ethSavings[msg.sender] -= _amount;
        
        payable(_receiver).transfer(_amount);
    }
    
    function checkContractEthBal() external view returns (uint256) {
        return address(this).balance;
    }


    function checkContractTokenBalance() external view returns(uint256) {
        return IERC20(savingToken).balanceOf(address(this));
    }

    function ownerWithdrawTokenSaving(uint256 _amount) external {
        require(msg.sender == owner, "not owner");
        IERC20(savingToken).transfer(msg.sender, _amount);
    }
}