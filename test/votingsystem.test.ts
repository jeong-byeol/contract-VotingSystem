import { ethers } from "hardhat";
import { expect } from "chai";
import { VotingSystem } from "../typechain-types";
import { Signer } from "ethers";

describe("VotingSystem", () => {
  let votingSystem: VotingSystem;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    const VotingSystemFactory = await ethers.getContractFactory("VotingSystem", owner);
    votingSystem = (await VotingSystemFactory.deploy()) as VotingSystem;
    await votingSystem.waitForDeployment();
  });

  it("시즌 시작하고 후보 등록 및 투표 기능 동작 확인", async () => {
    await votingSystem.connect(owner).startNewSeason();
    expect(await votingSystem.currentSeason()).to.equal(1);

    await votingSystem.connect(owner).addCandidate("Alice");
    await votingSystem.connect(owner).addCandidate("Bob");
    await votingSystem.connect(owner).addCandidate("Charlie");

    const beforeVote = await votingSystem.getCandidateVotes(1, 1);
    expect(beforeVote).to.equal(0);

    await votingSystem.connect(addr1).vote(1);

    const afterVote = await votingSystem.getCandidateVotes(1, 1);
    expect(afterVote).to.equal(1);

    const seasonVotes = await votingSystem.getSeasonVoteCount(1);
    expect(seasonVotes).to.equal(1);

    const totalVotes = await votingSystem.getTotalVoteCount();
    expect(totalVotes).to.equal(1);
  });

  it("10표 이상 투표 시 실패", async () => {
    await votingSystem.connect(owner).startNewSeason();
    await votingSystem.connect(owner).addCandidate("Alice");

    for (let i = 0; i < 10; i++) {
      await votingSystem.connect(addr1).vote(1);
    }

    await expect(
      votingSystem.connect(addr1).vote(1)
    ).to.be.revertedWith("You've already voted ten times");
  });

  it("101명 초과 후보 등록 시 실패", async () => {
    await votingSystem.connect(owner).startNewSeason();

    for (let i = 1; i <= 101; i++) {
      await votingSystem.connect(owner).addCandidate(`Candidate ${i}`);
    }

    await expect(
      votingSystem.connect(owner).addCandidate("Overflow")
    ).to.be.revertedWith("The number of applicants is full!");
  });

  it("시즌 시작 전 등록 시 실패", async () => {
    await expect(
      votingSystem.connect(owner).addCandidate("BeforeSeason")
    ).to.be.revertedWith("It's before the start of the season");
  });
});

