// 以太坊相关工具函数
import { ethers } from 'ethers';

/**
 * 连接钱包
 * @returns {Promise<string>} 钱包地址
 */
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('请安装MetaMask钱包');
  }

  try {
    // 请求连接钱包
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (accounts.length === 0) {
      throw new Error('没有找到钱包账户');
    }

    return accounts[0];
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('用户拒绝了钱包连接请求');
    }
    throw error;
  }
};

/**
 * 获取网络信息
 * @returns {Promise<object>} 网络信息对象
 */
export const getNetworkInfo = async () => {
  if (!window.ethereum) {
    throw new Error('请安装MetaMask钱包');
  }

  try {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    });
    console.log('getNetworkInfo: 链ID:', chainId);

    // 根据链ID判断网络类型和名称
    let networkType, networkName;
    switch (chainId) {
      case '0x1':
        networkType = 'mainnet';
        networkName = '以太坊主网';
        break;
      case '0xaa36a7': // Sepolia测试网
        networkType = 'test';
        networkName = 'Sepolia测试网';
        break;
      case '0x5': // Goerli测试网（已废弃）
        networkType = 'test';
        networkName = 'Goerli测试网';
        break;
      case '0x539':
        networkType = 'local';
        networkName = '本地网络';
        break;
      default:
        console.log('未知网络，当前Chain ID:', chainId);
        networkType = 'test';
        networkName = '未知网络';
    }

    return {
      type: networkType,
      name: networkName,
      chainId: chainId,
      chainIdDecimal: parseInt(chainId, 16)
    };
  } catch (error) {
    console.error('获取网络信息失败:', error);
    return {
      type: 'test',
      name: '未知网络',
      chainId: '0x0',
      chainIdDecimal: 0
    };
  }
};

/**
 * 切换网络
 * @param {string} network 目标网络
 * @returns {Promise<void>}
 */
export const switchNetwork = async (network) => {
  if (!window.ethereum) {
    throw new Error('请安装MetaMask钱包');
  }

  const chainIds = {
    test: '0xaa36a7', // Sepolia测试网
    local: '0x539', // Localhost
    mainnet: '0x1', // Mainnet
  };

  const targetChainId = chainIds[network];
  if (!targetChainId) {
    throw new Error('不支持的网络类型');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    });
  } catch (error) {
    if (error.code === 4902) {
      // 网络不存在，尝试添加网络
      await addNetwork(network);
    } else {
      throw error;
    }
  }
};

/**
 * 添加网络
 * @param {string} network 网络类型
 * @returns {Promise<void>}
 */
export const addNetwork = async (network) => {
  const networkConfigs = {
    test: {
      chainId: '0xaa36a7',
      chainName: 'Sepolia Testnet',
      nativeCurrency: {
        name: 'Sepolia ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://sepolia.infura.io/v3/28b48ace2abf40e4ad15359cf9e3a39d'],
      blockExplorerUrls: ['https://sepolia.etherscan.io/'],
    },
    local: {
      chainId: '0x539',
      chainName: 'Localhost 8545',
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['http://localhost:8545/'],
      blockExplorerUrls: [],
    },
  };

  const config = networkConfigs[network];
  if (!config) {
    throw new Error('不支持的网络类型');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [config],
    });
  } catch (error) {
    throw new Error(`添加网络失败: ${error.message}`);
  }
};

/**
 * 获取账户余额
 * @param {string} address 地址
 * @returns {Promise<string>} 余额（ETH）
 */
export const getBalance = async (address) => {
  if (!window.ethereum) {
    throw new Error('请安装MetaMask钱包');
  }

  try {
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });

    // 转换为ETH单位
    return ethers.formatEther(balance);
  } catch (error) {
    throw new Error(`获取余额失败: ${error.message}`);
  }
};

/**
 * 验证以太坊地址
 * @param {string} address 地址
 * @returns {boolean} 是否有效
 */
export const isValidAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // 检查地址格式
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address);
};

/**
 * 格式化地址显示
 * @param {string} address 地址
 * @param {number} start 开始显示的字符数
 * @param {number} end 结束显示的字符数
 * @returns {string} 格式化后的地址
 */
export const formatAddress = (address, start = 6, end = 4) => {
  if (!address) return '';
  if (address.length <= start + end) return address;
  
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

/**
 * 监听钱包事件
 * @param {Function} onAccountsChanged 账户变化回调
 * @param {Function} onChainChanged 网络变化回调
 */
export const listenToWalletEvents = (onAccountsChanged, onChainChanged) => {
  if (!window.ethereum) {
    return;
  }

  // 监听账户变化
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
      // 用户断开了钱包连接
      onAccountsChanged(null);
    } else {
      onAccountsChanged(accounts[0]);
    }
  });

  // 监听网络变化
  window.ethereum.on('chainChanged', (chainId) => {
    onChainChanged(chainId);
  });
};

/**
 * 移除钱包事件监听
 */
export const removeWalletEventListeners = () => {
  if (!window.ethereum) {
    return;
  }

  window.ethereum.removeAllListeners();
};

/**
 * 获取交易状态
 * @param {string} txHash 交易哈希
 * @returns {Promise<Object>} 交易状态
 */
export const getTransactionStatus = async (txHash) => {
  if (!window.ethereum) {
    throw new Error('请安装MetaMask钱包');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return { status: 'pending', message: '交易处理中...' };
    }

    if (receipt.status === 1) {
      return { status: 'success', message: '交易成功', receipt };
    } else {
      return { status: 'failed', message: '交易失败', receipt };
    }
  } catch (error) {
    throw new Error(`获取交易状态失败: ${error.message}`);
  }
};

/**
 * 估算Gas费用
 * @param {Object} transaction 交易对象
 * @returns {Promise<string>} Gas费用（ETH）
 */
export const estimateGas = async (transaction) => {
  if (!window.ethereum) {
    throw new Error('请安装MetaMask钱包');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const gasEstimate = await provider.estimateGas(transaction);
    
    // 获取当前gas价格
    const gasPrice = await provider.getFeeData();
    
    // 计算总费用
    const totalFee = gasEstimate * gasPrice.gasPrice;
    
    return ethers.formatEther(totalFee);
  } catch (error) {
    throw new Error(`估算Gas费用失败: ${error.message}`);
  }
};
