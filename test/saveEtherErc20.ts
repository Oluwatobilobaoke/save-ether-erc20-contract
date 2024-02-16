import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SaveEtherERC20", () => {
  async function deploySaveEtherERC20() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, addr1] = await ethers.getSigners();

    const tokenName = "SAVEWEB3CX";
    const tokenSymbol = "SW3B";

    const ERC20 = await ethers.getContractFactory("ERC20Token");
    const erc20 = await ERC20.deploy(owner.address, tokenName, tokenSymbol);

    const SaveEtherERC20 = await ethers.getContractFactory("saveEtherERC20");

    const saveEtherERC20 = await SaveEtherERC20.deploy(
      await erc20.getAddress()
    );

    console.log(`ERC20 contract deployed to ${await erc20.getAddress()}`);

    console.log(
      `saveEtherERC20 contract deployed to ${await saveEtherERC20.getAddress()}`
    );

    return { owner, otherAccount, addr1, erc20, saveEtherERC20 };
  }

  describe("Deployment", () => {
    it("Should be able to deploy the ERC20 contract", async () => {
      const { erc20 } = await loadFixture(deploySaveEtherERC20);
      expect(erc20.target).to.not.equal(0);
    });

    it("Should be able to deploy the saveEtherERC20 contract", async () => {
      const { saveEtherERC20 } = await loadFixture(deploySaveEtherERC20);
      expect(saveEtherERC20.target).to.not.equal(0);
    });

    it("Should be able to deploy the ERC20 contract with the right owner", async () => {
      const { owner, erc20 } = await loadFixture(deploySaveEtherERC20);
      expect(await erc20.owner()).to.equal(owner.address);
    });
  });

  describe("Deposit ETH", () => {
    it("Should be able to deposit ether", async () => {
      const { owner, otherAccount, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );

      const depositAmount = ethers.parseEther("1");

      await saveEtherERC20.connect(owner).depositEth({ value: depositAmount });

      const balance = await saveEtherERC20.checkEthSavings(owner.address);

      expect(balance).to.equal(depositAmount);
    });

    it("should not be able to deposit if value is 0", async function () {
      const { owner, saveEtherERC20 } = await loadFixture(deploySaveEtherERC20);

      await expect(saveEtherERC20.depositEth({ value: 0 })).to.be.revertedWith(
        "can't save zero value"
      );
    });
  });

  describe("Deposit Token", () => {
    it("Should be able to deposit ERC20 tokens", async () => {
      const { owner, otherAccount, erc20, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );

      const depositAmount = ethers.parseUnits("1", 18);

      await erc20.transfer(otherAccount.address, depositAmount);

      await erc20
        .connect(otherAccount)
        .approve(saveEtherERC20.target, depositAmount);
      await saveEtherERC20.connect(otherAccount).depositToken(depositAmount);

      const balance = await saveEtherERC20.checkTokenSavings(
        otherAccount.address
      );

      expect(balance).to.equal(depositAmount);
    });
    it("Owner Should be able to deposit ERC20 tokens", async () => {
      const { owner, erc20, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );

      const depositAmount = ethers.parseUnits("1", 18);

      await erc20.approve(saveEtherERC20.target, depositAmount);
      await saveEtherERC20.depositToken(depositAmount);

      const balance = await saveEtherERC20.checkTokenSavings(owner.address);

      expect(balance).to.equal(depositAmount);
    });

    it("Should not be able to deposit if value is 0", async () => {
      const { owner, saveEtherERC20 } = await loadFixture(deploySaveEtherERC20);

      await expect(saveEtherERC20.depositToken(0)).to.be.revertedWith(
        "can't save zero value"
      );
    });

    it("Should not be able to deposit if not enough token", async () => {
      const { owner, otherAccount, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );

      const depositAmount = ethers.parseUnits("1", 18);

      await expect(
        saveEtherERC20.connect(otherAccount).depositToken(depositAmount)
      ).to.be.revertedWith("not enough token");
    });

    it("Should not be able to deposit if not enough allowance", async () => {
      const { owner, otherAccount, erc20, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );

      const depositAmount = ethers.parseUnits("1", 18);

      await erc20.transfer(otherAccount.address, depositAmount);

      await expect(
        saveEtherERC20.connect(otherAccount).depositToken(depositAmount)
      ).to.be.reverted;
    });

    it("Should emit a Deposit event", async () => {
      const { owner, otherAccount, erc20, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );

      const depositAmount = ethers.parseUnits("1", 18);

      await erc20.transfer(otherAccount.address, depositAmount);

      await erc20
        .connect(otherAccount)
        .approve(saveEtherERC20.target, depositAmount);

      await expect(
        saveEtherERC20.connect(otherAccount).depositToken(depositAmount)
      )
        .to.emit(saveEtherERC20, "SavingSuccessful")
        .withArgs(otherAccount.address, depositAmount);
    });
  });

  describe("Withdraw ETH", function () {
    it("Should be able to withdraw ether", async function () {
      const { owner, saveEtherERC20 } = await loadFixture(deploySaveEtherERC20);

      const depositAmount = ethers.parseEther("1");

      await saveEtherERC20.depositEth({ value: depositAmount });

      const balanceBefore = await saveEtherERC20.checkEthSavings(owner.address);

      await saveEtherERC20.withdrawEth();

      const balanceAfter = await saveEtherERC20.checkEthSavings(owner.address);

      expect(balanceAfter).to.equal(0);
    });

    it("should not be able to withdraw if the balance is 0", async function () {
      const { owner, saveEtherERC20 } = await loadFixture(deploySaveEtherERC20);

      await expect(saveEtherERC20.withdrawEth()).to.be.revertedWith(
        "you don't have any saving in eth"
      );
    });

    it("should not be able to withdraw from another account", async function () {
      const { owner, otherAccount, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );

      const depositAmount = ethers.parseEther("1");

      await saveEtherERC20.depositEth({ value: depositAmount });

      await expect(
        saveEtherERC20.connect(otherAccount).withdrawEth()
      ).to.be.revertedWith("you don't have any saving in eth");
    });
  });

  describe("Withdraw Token", () => {
    it("Should be able to withdraw ERC20 tokens", async () => {
      const { owner, otherAccount, erc20, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );

      const depositAmount = ethers.parseUnits("1", 18);

      await erc20.transfer(otherAccount.address, depositAmount);

      await erc20
        .connect(otherAccount)
        .approve(saveEtherERC20.target, depositAmount);
      await saveEtherERC20.connect(otherAccount).depositToken(depositAmount);

      const balanceBefore = await saveEtherERC20.checkTokenSavings(
        otherAccount.address
      );

      await saveEtherERC20.connect(otherAccount).withdrawToken(depositAmount);

      const balanceAfter = await saveEtherERC20.checkTokenSavings(
        otherAccount.address
      );

      expect(balanceAfter).to.equal(0);
    });

    it("Should not be able to withdraw if the balance is 0", async () => {
      const { owner, saveEtherERC20 } = await loadFixture(deploySaveEtherERC20);

      await expect(saveEtherERC20.withdrawToken(0)).to.be.revertedWith(
        "can't withdraw zero value"
      );
    });

    it("Should not be able to withdraw if insufficient funds", async () => {
      const { owner, otherAccount, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );
      const amountToWithdraw = ethers.parseUnits("1", 18);

      await expect(
        saveEtherERC20.connect(otherAccount).withdrawToken(amountToWithdraw)
      ).to.be.revertedWith("insufficient funds");
    });

    it("Should emit a Withdrawal event", async () => {
      const { owner, otherAccount, erc20, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );

      const depositAmount = ethers.parseUnits("1", 18);

      await erc20.transfer(otherAccount.address, depositAmount);

      await erc20
        .connect(otherAccount)
        .approve(saveEtherERC20.target, depositAmount);
      await saveEtherERC20.connect(otherAccount).depositToken(depositAmount);

      await expect(
        saveEtherERC20.connect(otherAccount).withdrawToken(depositAmount)
      )
        .to.emit(saveEtherERC20, "WithdrawSuccessful")
        .withArgs(otherAccount.address, depositAmount);
    });

    it("Owner should be able to withdraw all money", async () => {
      const { owner, otherAccount, erc20, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );

      const depositAmount = ethers.parseUnits("2", 18);
      const secondDepositAmount = ethers.parseUnits("3", 18);

      await erc20.transfer(otherAccount.address, depositAmount);
      // await erc20.transfer(owner.address, depositAmount);

      await erc20
        .connect(otherAccount)
        .approve(saveEtherERC20.target, depositAmount);
      await saveEtherERC20.connect(otherAccount).depositToken(depositAmount);

      await erc20.approve(saveEtherERC20.target, secondDepositAmount);
      await saveEtherERC20.depositToken(secondDepositAmount);

      const totalAmountToWiThdraw = depositAmount + secondDepositAmount;

      await saveEtherERC20.ownerWithdrawTokenSaving(totalAmountToWiThdraw);

      const contractBal = await saveEtherERC20.checkContractTokenBalance();

      expect(contractBal).to.equal(0);
    });
  });

  describe("ETH Savings", function () {
    it("Should be able to check the savings", async function () {
      const { owner, saveEtherERC20 } = await loadFixture(deploySaveEtherERC20);

      const depositAmount = ethers.parseEther("1");

      await saveEtherERC20.depositEth({ value: depositAmount });

      const balance = await saveEtherERC20.checkEthSavings(owner.address);

      expect(balance).to.equal(depositAmount);
    });

    it("should be able to check savings from another account", async function () {
      const { owner, otherAccount, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );

      const depositAmount = ethers.parseEther("1");

      await saveEtherERC20.depositEth({ value: depositAmount });

      const balance = await saveEtherERC20
        .connect(otherAccount)
        .checkEthSavings(owner.address);

      expect(balance).to.equal(depositAmount);
    });

    it("total savings and saved amount must be the same", async function () {
      const { owner, otherAccount, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );

      const depositAmount = ethers.parseEther("1");
      const secondDepositAmount = ethers.parseEther("2");

      await saveEtherERC20.depositEth({ value: depositAmount });

      await saveEtherERC20
        .connect(otherAccount)
        .depositEth({ value: secondDepositAmount });

      const balance = await saveEtherERC20.checkContractEthBal();

      const totalSavings = depositAmount + secondDepositAmount;

      expect(balance).to.equal(totalSavings);
    });

    it("should be able to send out ", async function () {
      const { owner, otherAccount, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );

      const depositAmount = ethers.parseEther("2");

      await saveEtherERC20.depositEth({ value: depositAmount });

      let balanceOFOwner = await saveEtherERC20.checkEthSavings(owner.address);

      const sendOutAmount = ethers.parseEther("1");

      await saveEtherERC20.sendOutEthSaving(
        otherAccount.address,
        sendOutAmount
      );

      balanceOFOwner = await saveEtherERC20.checkEthSavings(owner.address);

      expect(balanceOFOwner).to.equal(sendOutAmount);
    });
  });

  describe("Token Savings", () => {
    it("should be able to get user balance", async () => {
      const { owner, erc20, saveEtherERC20 } = await loadFixture(deploySaveEtherERC20);

      const depositAmount = ethers.parseUnits("2", 18);

      await erc20.approve(saveEtherERC20.target, depositAmount);

      await saveEtherERC20.depositToken(depositAmount);

      const balance = await saveEtherERC20.checkTokenSavings(owner.address);

      expect(balance).to.equal(depositAmount);
    });

    it("should be able to get contract balance", async () => {
      const { owner, otherAccount, erc20, saveEtherERC20 } = await loadFixture(
        deploySaveEtherERC20
      );

      const depositAmount = ethers.parseUnits("2", 18);

      await erc20.transfer(otherAccount.address, depositAmount);

      await erc20
        .connect(otherAccount)
        .approve(saveEtherERC20.target, depositAmount);

      await saveEtherERC20.connect(otherAccount).depositToken(depositAmount);

      const balance = await saveEtherERC20.checkContractTokenBalance();

      expect(balance).to.equal(depositAmount);
    });

    it("Total balance and user balance must be equal", async () => {
      const { owner, otherAccount, addr1, erc20, saveEtherERC20 } =
        await loadFixture(deploySaveEtherERC20);

      const depositAmount = ethers.parseUnits("2", 18);

      await erc20.transfer(addr1.address, depositAmount);

      await erc20.connect(addr1).approve(saveEtherERC20.target, depositAmount);

      await saveEtherERC20.connect(addr1).depositToken(depositAmount);

      const transferAmount = ethers.parseUnits("5", 18);

      await erc20.transfer(otherAccount.address, transferAmount);

      await erc20
        .connect(otherAccount)
        .approve(saveEtherERC20.target, transferAmount);

      await saveEtherERC20.connect(otherAccount).depositToken(transferAmount);

      await erc20.approve(saveEtherERC20.target, depositAmount);

      await saveEtherERC20.depositToken(depositAmount);

      const balance = await saveEtherERC20.checkContractTokenBalance();

      const [user1, user2, user3] = await Promise.all([
        saveEtherERC20.checkTokenSavings(addr1.address),
        saveEtherERC20.checkTokenSavings(otherAccount.address),
        saveEtherERC20.checkTokenSavings(owner.address),
      ]);

      console.log(`user1: has saving balance of ${user1}`);
      console.log(`user2: has saving balance of ${user2}`);
      console.log(`user3: has saving balance of ${user3}`);

      const usersbalance = user1 + user2 + user3;

      expect(balance).to.equal(usersbalance);
    });
  });

  describe("Events", function () {
    it("Should emit a SavingSuccessful event", async function () {
      const { owner, saveEtherERC20 } = await loadFixture(deploySaveEtherERC20);

      const depositAmount = ethers.parseEther("1");

      await expect(saveEtherERC20.depositEth({ value: depositAmount }))
        .to.emit(saveEtherERC20, "SavingSuccessful")
        .withArgs(owner.address, depositAmount);
    });
  });
});
