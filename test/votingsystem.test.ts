import {expect} from "chai";
import {ethers} from "hardhat";

describe("VotingSystem", function () {
  let contract: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners(); //임의의 배포자 및 지원자,투표자
    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    contract = await VotingSystem.deploy();
    await contract.waitForDeployment();
  });

  it("1. 시즌 시작 전에는 지원자 등록 불가", async () => {
    // 시즌시작함수 호출 전에 user1이 지원자 등록함수 호출 시 실패
    await expect(contract.connect(user1).addCandidate("Alice")).to.be.revertedWith("It's before the start of the season");
  });

  it("2. 배포자만 시즌 시작 가능", async () => {
    //user1이 시즌시작함수 호출 시 오류 메세지가 같아야함
    await expect(contract.connect(user1).startNewSeason()).to.be.revertedWith("You don't have permission");
    //woner(배포자)이 시즌시작함수 호출 시 컨트랙트에있는 SeasonStarted이벤트 발생
    await expect(contract.connect(owner).startNewSeason()).to.emit(contract,"SeasonStarted");
  });

  it("3. 시즌 시작 후 지원자 등록 가능", async () => {
    await contract.connect(owner).startNewSeason(); //배포자가 시즌시작함수 호출
    //user1이 지원자등록 함수 호출 시 CandidateAdded이벤트 발생
    await expect(contract.connect(user1).addCandidate("Bob")).to.emit(contract,"CandidateAdded");
  });

  it("4. 없는 지원자 번호에 투표 시 오류 발생", async () => {
    await contract.connect(owner).startNewSeason(); //시즌 시작
    await contract.connect(user1).addCandidate("Alice"); // user1 지원자 등록
    //투표자user2가 999번에 투표할려고하면 오류 발생
    await expect(contract.connect(user2).vote(999)).to.be.revertedWith("Invalid candidate");
  });

  it("5. 10표 이상 투표 시 실패", async () => {
    await contract.connect(owner).startNewSeason(); //시즌시작
    await contract.connect(user1).addCandidate("Alice"); //user1 지원자 등록

    for (let i = 0; i < 10; i++) { // 투표자user2가 1번한테 10번 투표함
      await contract.connect(user2).vote(1);
    }
    // 이미 10번 투표한 상태에서 또 1번에 투표 시 오류 발생
    await expect(contract.connect(user2).vote(1)).to.be.revertedWith("You've already voted ten times");
  });

  it("6. 투표 기능 작동하고 정보 반영 확인", async () => {
    await contract.connect(owner).startNewSeason();
    await contract.connect(user1).addCandidate("Alice");
    await contract.connect(user2).vote(1); //투표자 user2가 1번(Alice)에 투표(1번은 투표1개를 받은 상태)
    // 시즌1에 1번 지원자의 투표수는 1개
    const voteCount = await contract.getCandidateVotes(1, 1); 
    expect(voteCount).to.equal(1); 
  });

  it("7. 특정 시즌 총 투표수 반환 확인", async () => {
    await contract.connect(owner).startNewSeason();
    await contract.connect(user1).addCandidate("Alice");
    await contract.connect(user2).addCandidate("Bob");
    await contract.connect(user3).vote(1);
    await contract.connect(user3).vote(2);
    //시즌1에 투표자 user3이 두 번 투표했으므로 시즌1의 총 투표수는 2이다
    const vote = await contract.getSeasonVoteCount(1);
    expect(vote).to.equal(2);
  });

  it("8. 전체 시즌 누적 투표수 반환 확인", async () => {
    await contract.connect(owner).startNewSeason(); //시즌1 시작
    await contract.connect(user1).addCandidate("Alice");
    await contract.connect(user2).addCandidate("Bob");
    await contract.connect(user3).vote(1);
    await contract.connect(user3).vote(2);

    await contract.connect(owner).startNewSeason(); //시즌2 시작
    await contract.connect(user1).addCandidate("Carol");
    await contract.connect(user2).vote(1);
    //시즌1에는 투표 두 번, 시즌2에는 투표 한 번했으므로 전체 시즌 누적 투표수는 3이다
    const votecount = await contract.getTotalVoteCount();
    expect(votecount).to.equal(3);
  });
});

