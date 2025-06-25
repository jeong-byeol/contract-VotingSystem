// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract VotingSystem {
    address owner;   

    uint public totalVoteCount; //모든 시즌 투표수 
    uint public currentSeason; //시즌1부터 시작

    struct Voter { //투표자
        
        uint256 vote; // 투표자가 투표한 id
        uint limitvote; // 최대 10번 투표 가능
    }

    struct Candidate { //지원자 
        uint256 id; //지원자 번호
        string name; //지원자 이름
        uint256 voteCount; //지원자가 받은 투표수
    }

    struct Season { //시즌 도입
        mapping(address => Voter) voters;
        mapping(uint256 => Candidate) candidates;
        uint256 candidatesCount; //지원자수
        uint voteCount; //시즌별 총 투표수
    }
    
    mapping(uint => Season) private seasons; //시즌별 데이터


    // 이벤트
    event VoteCasted(address voter, uint256 candidateId, uint seasonId); //투표 발생 시 로그에 기록
    event CandidateAdded(uint256 candidateId, string name, uint seasonId); 
    event SeasonStarted(uint seasonId);

    constructor () {
        owner = msg.sender;
    }

    // 시즌 시작 함수
    function startNewSeason() public {
        require(owner == msg.sender,"You don't have permission"); //배포자만 시즌 시작 가능
        currentSeason++;
        emit SeasonStarted(currentSeason);
    }

    // 지원자 등록
    function addCandidate(string memory _name) public {
        Season storage s = seasons[currentSeason]; // s에 해당 시즌에 대한 Season구조체 저장 
        require(currentSeason != 0,"It's before the start of the season");
        require(s.candidatesCount < 101, "The number of applicants is full!"); //지원자수 101명으로 제한
        s.candidatesCount++; //지원자수 증가
        s.candidates[s.candidatesCount] = Candidate(s.candidatesCount, _name, 0); 

        emit CandidateAdded(s.candidatesCount, _name, currentSeason);
    }

    // 투표 기능
    function vote(uint256 _candidateId) public {
        Season storage s = seasons[currentSeason];
        Voter storage v = s.voters[msg.sender];

        require(_candidateId > 0 && _candidateId <= s.candidatesCount, "Invalid candidate");//지원자는 0번이 없으며, 지원자는 101번까지 있음.
        require(v.limitvote < 10, "You've already voted ten times"); //10번까지 투표가능

       
        v.vote = _candidateId;//투표자가 투표한 사람
        v.limitvote++; 
        s.candidates[_candidateId].voteCount++; //뽑힌 지원자 투표수 up
        s.voteCount++; //해당 시즌 총 투표수 up
        totalVoteCount++; 

        emit VoteCasted(msg.sender, _candidateId, currentSeason); //해당 시즌에 대한 투표 정보 로그에 저장
    }


    //특정 시즌 후보에 대한 투표수 반환
    function getCandidateVotes(uint _seasonId, uint _candidateId) public view returns (uint) {
        require(_candidateId > 0 && _candidateId <= seasons[_seasonId].candidatesCount, "Invalid candidate");
        return seasons[_seasonId].candidates[_candidateId].voteCount;
    }

     // 특정 시즌 총 투표 수
    function getSeasonVoteCount(uint _seasonId) public view returns (uint) {
        return seasons[_seasonId].voteCount;
    }

    // 전체 시즌 누적 투표 수
    function getTotalVoteCount() public view returns (uint) {
        return totalVoteCount;
    }
}
    