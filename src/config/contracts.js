// 合约配置文件
export const CONTRACTS = {
  // 测试合约地址
  TEST_CONTRACT: '0x12C7d98417C7AD4273ee900132Da27B56eC5C4a1',

  // 网络配置
  NETWORKS: {
    test: {
      name: 'Sepolia测试网',
      chainId: '0xaa36a7', // Sepolia的Chain ID: 11155111
      rpcUrl: 'https://sepolia.infura.io/v3/28b48ace2abf40e4ad15359cf9e3a39d',
      explorer: 'https://sepolia.etherscan.io/'
    },
    local: {
      name: '本地网络',
      chainId: '0x539',
      rpcUrl: 'http://localhost:8545/',
      explorer: ''
    },
    mainnet: {
      name: '主网',
      chainId: '0x1',
      rpcUrl: 'https://mainnet.infura.io/v3/',
      explorer: 'https://etherscan.io/'
    }
  }
};

// 获取合约地址的辅助函数
export const getContractAddress = (contractName) => {
  return CONTRACTS[contractName];
};

// 获取网络信息的辅助函数
export const getNetworkInfo = (network) => {
  return CONTRACTS.NETWORKS[network] || CONTRACTS.NETWORKS.test;
};
