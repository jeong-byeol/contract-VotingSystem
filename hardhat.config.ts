import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    cardona: {
      url:"https://rpc.cardona.zkevm-rpc.com",
      accounts:[process.env.PRIVATE_KEY!]
    }
  }
};

export default config;
