import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const LockModule = buildModule("LockModule", (m) => {
  const unlockTime = m.contract("VotingSystem");



  return { unlockTime };
});

export default LockModule;
