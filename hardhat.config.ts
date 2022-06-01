import "@nomiclabs/hardhat-waffle";
	import 'solidity-coverage';
	import * as dotenv from "dotenv";
	import "./tasks/index.ts";
	import "@nomiclabs/hardhat-etherscan";
	dotenv.config();

	export default{
      networks: {
        hardhat: {
          forking: {
            url: "https://eth-rinkeby.alchemyapi.io/v2/mHUqKR8JUKzLTehubGSYtHRteQt2qx1B",
            blockNumber: 10743596
          },
          accounts: {
            mnemonic: process.env.MNEMONIK,
            count: 10
          }, 
        }, 
        rinkeby: {
          url: process.env.RINKEBY_URL,
          accounts: {
            mnemonic: process.env.MNEMONIK,
            count: 10
          }, 
      }
     
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}
