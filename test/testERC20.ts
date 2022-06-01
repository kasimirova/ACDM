const { expect } = require("chai");
const { ethers } = require("hardhat");
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";

let ERC20: Contract, ERC_20: Contract, owner: SignerWithAddress, addr1: SignerWithAddress, addr2: SignerWithAddress, addr3: SignerWithAddress;

describe("ERC20", function () {
  before(async function () 
  {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    ERC20 = await ethers.getContractFactory("ERC20");
    ERC_20 = await ERC20.deploy("Carrot", "Crt", 18, ethers.utils.parseEther("10000"));
    await ERC_20.deployed();
  });

  it("Transfer tokens", async function () {
    await ERC_20.connect(owner).transfer(addr1.address, ethers.utils.parseEther("1000"));
    expect(await ERC_20.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("1000"));
    await ERC_20.connect(owner).transfer(addr2.address, ethers.utils.parseEther("500"));
    expect(await ERC_20.balanceOf(addr2.address)).to.equal(ethers.utils.parseEther("500"));
  }
  );

  it("Transfer tokens with not enough money", async function () {
    await expect(ERC_20.connect(addr2).transfer(addr3.address, ethers.utils.parseEther("600"))).to.be.revertedWith("Not enough tokens");
  }
  );


  it("Approve with enough money", async function () {
    await ERC_20.connect(addr1).approve(addr2.address, ethers.utils.parseEther("100"));
    expect(await ERC_20.allowance(addr1.address, addr2.address)).to.equal(ethers.utils.parseEther("100"));
  }
  );

  it("Transfer from with enough money", async function () {
    await ERC_20.connect(addr2).transferFrom(addr1.address, addr3.address, ethers.utils.parseEther("30"));
    expect(await ERC_20.balanceOf(addr3.address)).to.equal(ethers.utils.parseEther("30"));  
  }
  );

  it("Transfer from with not enough money", async function () {
    await expect (ERC_20.connect(addr2).transferFrom(addr1.address, addr3.address, ethers.utils.parseEther("100"))).to.be.revertedWith("Not enough allowance to transfer");
  }
  );

  it("Get token's name", async function () {
    expect (await ERC_20.name()).to.be.equal("Carrot");
  }
  );

  it("Get token's symbol", async function () {
    expect (await ERC_20.symbol()).to.be.equal("Crt");
  }
  );

  it("Get token's decimals", async function () {
    expect (await ERC_20.decimals()).to.be.equal(18);
  }
  );

  it("Get token's total supply", async function () {
    expect (await ERC_20.totalSupply()).to.be.equal(ethers.utils.parseEther("10000"));
  }
  );

  it("Burn as not an owner", async function () {
    await expect(ERC_20.connect(addr2).burn(addr2.address, ethers.utils.parseEther("10"))).to.be.reverted;
  }
  );

  it("Mint as not an owner", async function () {
    await expect(ERC_20.connect(addr2).mint(addr2.address, ethers.utils.parseEther("5"))).to.be.reverted;
  }
  );

  it("Burn", async function () {
    await ERC_20.burn(owner.address, ethers.utils.parseEther("500"));
    expect(await ERC_20.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("8000"));
  }
  );

  it("Burn more tokens than address has", async function () {
    await expect(ERC_20.burn(owner.address, ethers.utils.parseEther("9000"))).to.be.revertedWith("Not enough tokens");
  }
  );

});