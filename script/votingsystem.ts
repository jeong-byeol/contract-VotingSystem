import { ethers } from "hardhat";
import { VotingSystem } from "../typechain-types";

async function main() {
  const [deployer, ...voters] = await ethers.getSigners();
  const VotingSystemFactory = await ethers.getContractFactory("VotingSystem");
  const votingSystem = (await VotingSystemFactory.deploy()) as VotingSystem;
  await votingSystem.waitForDeployment();
  console.log(`계약 배포 완료: ${votingSystem.address}`);

  // 시즌 시작
  const tx = await votingSystem.startNewSeason();
  await tx.wait();
  const seasonId = await votingSystem.currentSeason();
  console.log(`시즌 ${seasonId} 시작`);

  // 후보자 101명 등록
  for (let i = 1; i <= 101; i++) {
    const tx = await votingSystem.addCandidate(`Candidate ${i}`);
    await tx.wait();
  }
  console.log(`후보자 101명 등록 완료`);

  // 100명 투표자 각자 10번 랜덤 투표
  const voterList = voters.slice(0, 100);
  for (const [i, signer] of voterList.entries()) {
    for (let j = 0; j < 10; j++) {
      const candidateId = Math.floor(Math.random() * 101) + 1; // 1~101
      try {
        const tx = await votingSystem.connect(signer).vote(candidateId);
        await tx.wait();
        console.log(`Voter ${i + 1} → 후보 ${candidateId}`);
      } catch (err) {
        console.log(`Voter ${i + 1} 투표 실패 (${err.message})`);
      }
    }
  }

  // 시즌 요약
  const totalVotes = await votingSystem.getSeasonVoteCount(seasonId);
  console.log(`시즌 ${seasonId} 총 투표수: ${totalVotes}`);

  // 상위 후보자 5명 출력
  const voteCounts: { id: number; votes: number }[] = [];
  for (let i = 1; i <= 101; i++) {
    const votes = await votingSystem.getCandidateVotes(seasonId, i);
    voteCounts.push({ id: i, votes: parseInt(votes.toString()) });
  }

  voteCounts.sort((a, b) => b.votes - a.votes);
  console.log("득표 상위 후보 TOP 5:");
  for (let i = 0; i < 5; i++) {
    console.log(`- 후보 ${voteCounts[i].id} : ${voteCounts[i].votes} 표`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
