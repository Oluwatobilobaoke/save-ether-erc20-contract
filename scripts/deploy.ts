import { ethers } from "hardhat";

async function main() {
  const initialOwner = "0x6694c714e3Be435Ad1e660C37Ea78351092b0075";
  const erc20Contract = await ethers.deployContract("ERC20Token", [
    initialOwner,
    "SAVEWEB3CX",
    "SW3B",
  ]);

  await erc20Contract.waitForDeployment();

  console.log(`ERC20 Token contract deployed to ${erc20Contract.target}`);

  const saveEtherERC20 = await ethers.deployContract("saveEtherERC20", [
    erc20Contract.target,
  ]);

  await saveEtherERC20.waitForDeployment();

  console.log(`SaveEtherERC20 contract deployed to ${saveEtherERC20.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// npx hardhat run scripts/deploy.ts --network sepolia
// ERC20 Token contract deployed to 0x397ADa89e050288f42EaFdb8aa7B4B46dDeaA3aE
// npx hardhat verify --network sepolia 0x397ADa89e050288f42EaFdb8aa7B4B46dDeaA3aE 0x6694c714e3Be435Ad1e660C37Ea78351092b0075 SAVEWEB3CX SW3B

// saveERC20 contract deployed to 0xAC0a47055733D0Bbcb64646BCB072169B0060448
// npx hardhat verify --network sepolia 0xAC0a47055733D0Bbcb64646BCB072169B0060448 0x397ADa89e050288f42EaFdb8aa7B4B46dDeaA3aE

// npx hardhat test
