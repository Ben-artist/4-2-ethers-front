import React, { useState, useEffect } from 'react';
import { Layout, Typography, Select, Button, message, Tabs, Avatar, Dropdown, Space, Badge, Card, Divider } from 'antd';
import { WalletOutlined, UserOutlined, DollarCircleFilled, DownOutlined, ReloadOutlined, CopyOutlined, SwapOutlined, GiftOutlined } from '@ant-design/icons';
import TransferMethod from './components/TransferMethod';
import LogMethod from './components/LogMethod';
import RedPacketMethod from './components/RedPacketMethod';
import { connectWallet, getNetworkInfo, getBalance } from './utils/ethereum';
import { ethers } from 'ethers';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

function App() {
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('test');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [ethBalance, setEthBalance] = useState('0');
  const [accounts, setAccounts] = useState([]);
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);

  // 初始化时检查钱包连接状态
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // 监听钱包事件
  useEffect(() => {
    if (window.ethereum) {
      // 监听账户变化
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      // 监听网络变化
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // 检查钱包连接状态
  const checkWalletConnection = async () => {
    try {
      const accounts = await window.ethereum?.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        setAccounts(accounts);
        setCurrentAccountIndex(0); // 默认选择第一个账户
        
        // 设置provider和signer
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await newProvider.getSigner();
        setProvider(newProvider);
        setSigner(newSigner);
        
        await updateNetworkInfo();
        await updateBalance(accounts[0]);

        // 初始化时自动获取区块链记录
        setTimeout(async () => {
          try {
            console.log('初始化时开始获取交易记录...');
            const blockchainRecords = await fetchBlockchainRecords(accounts[0]);
            if (blockchainRecords.length > 0) {
              setRecords(blockchainRecords);
              console.log('初始化时获取到交易记录:', blockchainRecords.length, '条');
            } else {
              console.log('初始化时未获取到区块链记录，尝试获取历史记录...');
              // 如果区块链记录为空，尝试获取历史记录
              const historyRecords = await fetchSepoliaHistory(accounts[0]);
              if (historyRecords.length > 0) {
                setRecords(historyRecords);
                console.log('初始化时获取到历史记录:', historyRecords.length, '条');
              } else {
                console.log('初始化时未获取到任何记录');
              }
            }
          } catch (error) {
            console.error('初始化获取记录失败:', error);
          }
        }, 2000); // 增加到2秒延迟，确保网络连接稳定
      }
    } catch (error) {
      console.log('钱包未连接');
    }
  };

  // 处理账户变化
  const handleAccountsChanged = (newAccounts) => {
    console.log('App: 账户变化事件触发:', newAccounts);
    if (newAccounts.length === 0) {
      // 用户断开了钱包连接
      setWalletAddress('');
      setIsConnected(false);
      setEthBalance('0');
      setAccounts([]);
    } else {
      // 用户切换了账户
      const newAddress = newAccounts[0];
      console.log('App: 切换到新账户:', newAddress);
      setWalletAddress(newAddress);
      setCurrentAccountIndex(0);
      updateBalance(newAddress);
      updateAccounts(newAccounts);

      // 强制触发一次状态更新，确保子组件能收到变化
      setTimeout(() => {
        setWalletAddress(prev => {
          console.log('App: 强制更新walletAddress:', prev, '->', newAddress);
          return newAddress;
        });

        // 获取新账户的区块链记录
        setTimeout(async () => {
          try {
            console.log('账户切换后开始获取交易记录...');
            const blockchainRecords = await fetchBlockchainRecords(newAddress);
            if (blockchainRecords.length > 0) {
              setRecords(blockchainRecords);
              console.log('账户切换后获取到区块链记录:', blockchainRecords.length, '条');
            } else {
              console.log('账户切换后未获取到区块链记录，尝试获取历史记录...');
              // 如果区块链记录为空，尝试获取历史记录
              const historyRecords = await fetchSepoliaHistory(newAddress);
              if (historyRecords.length > 0) {
                setRecords(historyRecords);
                console.log('账户切换后获取到历史记录:', historyRecords.length, '条');
              } else {
                console.log('账户切换后未获取到任何记录');
              }
            }
          } catch (error) {
            console.error('账户切换后获取记录失败:', error);
          }
        }, 500); // 减少延迟到500ms
      }, 50);
    }
  };

  // 处理网络变化
  const handleChainChanged = (chainId) => {
    window.location.reload(); // 网络变化时刷新页面
  };

  // 更新网络信息
  const updateNetworkInfo = async () => {
    try {
      const networkInfo = await getNetworkInfo();
      setNetwork(networkInfo);
      setNetworkInfo(networkInfo);
    } catch (error) {
      console.error('获取网络信息失败:', error);
    }
  };

  // 更新余额
  const updateBalance = async (address) => {
    try {
      const balance = await getBalance(address);
      setEthBalance(balance);
    } catch (error) {
      console.error('获取余额失败:', error);
      setEthBalance('0');
    }
  };

  // 更新账户列表
  const updateAccounts = async (accountList) => {
    setAccounts(accountList);
  };

  // 连接钱包
  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      setIsConnected(true);
      
      // 设置provider和signer
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await newProvider.getSigner();
      setProvider(newProvider);
      setSigner(newSigner);
      
      await updateNetworkInfo();
      await updateBalance(address);

      // 获取所有账户
      const allAccounts = await window.ethereum.request({ method: 'eth_accounts' });
      setAccounts(allAccounts);
      setCurrentAccountIndex(0); // 默认选择第一个账户

      // 获取区块链记录
      setTimeout(() => {
        fetchBlockchainRecords(address).then(blockchainRecords => {
          if (blockchainRecords.length > 0) {
            setRecords(blockchainRecords);
            console.log('钱包连接后获取到最近5个区块交易记录:', blockchainRecords.length, '条');
          } else {
            console.log('钱包连接后未获取到交易记录');
          }
        });
      }, 1000);

      message.success('钱包连接成功！');
    } catch (error) {
      message.error('钱包连接失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取所有账户
  const getAllAccounts = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      console.log("All accounts from Ganache:");
      console.log(accounts);
      const allAccounts = await window.ethereum.request({ method: 'eth_accounts' });
      setAccounts(allAccounts);
      console.log('获取所有账户:', allAccounts);
      if (allAccounts.length > 0) {
        setCurrentAccountIndex(0); // 默认选择第一个账户
        setWalletAddress(allAccounts[0]);
        await updateBalance(allAccounts[0]);

        // 获取区块链记录
        setTimeout(() => {
          fetchBlockchainRecords(allAccounts[0]).then(blockchainRecords => {
            if (blockchainRecords.length > 0) {
              setRecords(blockchainRecords);
              console.log('刷新账户列表后获取到最近5个区块交易记录:', blockchainRecords.length, '条');
            } else {
              console.log('刷新账户列表后未获取到交易记录');
            }
          });
        }, 300);
      }
      return allAccounts;
    } catch (error) {
      console.error('获取账户列表失败:', error);
      return [];
    }
  };

  // 请求账户权限
  const requestAccounts = async () => {
    try {
      const newAccounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      console.log('请求账户权限:', newAccounts);
      if (newAccounts.length > 0) {
        setAccounts(newAccounts);
        setCurrentAccountIndex(0); // 默认选择第一个账户
        setWalletAddress(newAccounts[0]);
        await updateBalance(newAccounts[0]);

        // 获取区块链记录
        setTimeout(() => {
          fetchBlockchainRecords(newAccounts[0]).then(blockchainRecords => {
            if (blockchainRecords.length > 0) {
              setRecords(blockchainRecords);
              console.log('请求账户权限后获取到最近5个区块交易记录:', blockchainRecords.length, '条');
            } else {
              console.log('请求账户权限后未获取到交易记录');
            }
          });
        }, 300);

        message.success(`成功获取 ${newAccounts.length} 个账户`);
      }
      return newAccounts;
    } catch (error) {
      console.error('请求账户权限失败:', error);
      message.error('获取账户权限失败: ' + error.message);
      return [];
    }
  };

  // 切换网络
  const handleNetworkChange = async (value) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: getChainId(value) }],
      });
      setNetwork(value);
      message.success('网络切换成功！');
    } catch (error) {
      message.error('网络切换失败: ' + error.message);
    }
  };

  // 获取链ID
  const getChainId = (network) => {
    const chainIds = {
      test: '0xaa36a7', // Sepolia
      local: '0x539', // Localhost
      mainnet: '0x1', // Mainnet
    };
    return chainIds[network] || '0xaa36a7';
  };

  // 从Sepolia区块浏览器API获取历史交易记录
  const fetchSepoliaHistory = async (address) => {
    if (!address) return [];
    
    try {
      console.log('从Sepolia区块浏览器获取历史交易记录:', address);
      
      // 使用Sepolia区块浏览器API获取交易记录
      // 注意：Etherscan免费API有速率限制，建议注册获取API Key
      const apiUrl = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=USAKI6Z2INSM5XRW1JTEUZB753473IM37Q`;
      console.log('API请求URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('API响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API响应数据:', data);
      
      if (data.status === '1' && data.result && Array.isArray(data.result)) {
        console.log('从区块浏览器获取到交易记录:', data.result.length, '条');
        
        return data.result.map(tx => ({
          id: `etherscan-${tx.hash}`,
          timestamp: new Date(Number(tx.timeStamp) * 1000).toLocaleString(),
          type: '历史交易',
          description: `区块 #${tx.blockNumber} 中的交易`,
          txHash: tx.hash,
          blockNumber: tx.blockNumber,
          from: tx.from,
          to: tx.to,
          value: tx.value ? (Number(tx.value) / Math.pow(10, 18)).toFixed(8) : '0',
          gasUsed: tx.gasUsed,
          nonce: tx.nonce,
          gasLimit: tx.gasLimit || '0'
        }));
      } else if (data.status === '0') {
        console.log('API返回错误:', data.message);
        if (data.message.includes('No transactions found')) {
          console.log('该地址没有交易记录');
        } else if (data.message.includes('Missing/Invalid API Key')) {
          console.log('API Key问题，建议使用Infura RPC方式');
        }
        return [];
      } else {
        console.log('API响应格式异常:', data);
        return [];
      }
      
    } catch (error) {
      console.error('从区块浏览器获取历史记录失败:', error);
      return [];
    }
  };

  // 从区块链获取交易记录
  const fetchBlockchainRecords = async (address) => {
    if (!address || !window.ethereum) return [];

    console.log('开始获取地址的区块链记录:', address);
    setLoadingRecords(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // 获取当前网络信息
      const network = await provider.getNetwork();
      console.log('当前连接的网络:', network);

      // 获取最新的区块号
      const latestBlock = await provider.getBlockNumber();
      console.log('最新区块号:', latestBlock);

      // 增加获取的区块数量，从5个增加到20个
      const blocksToFetch = 20; // 获取最近20个区块
      const fromBlock = Math.max(0, latestBlock - blocksToFetch + 1);

      console.log(`获取区块范围: ${fromBlock} - ${latestBlock}`);

      // 获取多个区块的交易数据
      const blockPromises = [];
      for (let i = fromBlock; i <= latestBlock; i++) {
        blockPromises.push(provider.getBlock(i, true));
      }

      const blocks = await Promise.all(blockPromises);
      console.log(`成功获取 ${blocks.length} 个区块`);

      // 收集所有交易哈希
      let allTransactionHashes = [];
      blocks.forEach(block => {
        if (block && block.transactions && block.transactions.length > 0) {
          console.log(`区块 #${block.number}: ${block.transactions.length} 条交易`);
          // 将交易哈希和区块信息一起存储
          block.transactions.forEach(txHash => {
            allTransactionHashes.push({
              hash: txHash,
              blockNumber: block.number,
              timestamp: block.timestamp
            });
          });
        } else {
          console.log(`区块 #${block.number}: 无交易`);
        }
      });

      console.log(`总共收集到 ${allTransactionHashes.length} 条交易哈希`);

      if (allTransactionHashes.length === 0) {
        console.log('这些区块中没有交易，尝试获取更多区块...');
        // 尝试获取更多区块
        const moreBlocksToFetch = 100; // 增加到100个区块
        const moreFromBlock = Math.max(0, latestBlock - moreBlocksToFetch + 1);
        
        console.log(`尝试获取更多区块: ${moreFromBlock} - ${latestBlock}`);
        
        const moreBlockPromises = [];
        for (let i = moreFromBlock; i <= latestBlock; i++) {
          moreBlockPromises.push(provider.getBlock(i, true));
        }
        
        const moreBlocks = await Promise.all(moreBlockPromises);
        console.log(`获取更多区块: ${moreBlocks.length} 个`);
        
        moreBlocks.forEach(block => {
          if (block && block.transactions && block.transactions.length > 0) {
            console.log(`区块 #${block.number}: ${block.transactions.length} 条交易`);
            block.transactions.forEach(txHash => {
              allTransactionHashes.push({
                hash: txHash,
                blockNumber: block.number,
                timestamp: block.timestamp
              });
            });
          }
        });
        
        console.log(`扩展搜索后总共收集到 ${allTransactionHashes.length} 条交易哈希`);
        
        if (allTransactionHashes.length === 0) {
          console.log('仍然没有找到交易，可能网络中没有交易活动');
          return [];
        }
      }

      // 增加处理的交易数量
      const transactionsToProcess = allTransactionHashes.slice(0, 50); // 从10条增加到50条
      console.log(`总共找到 ${allTransactionHashes.length} 条交易，处理前 ${transactionsToProcess.length} 条`);

      // 处理区块中的交易数据
      const transactionPromises = transactionsToProcess.map(async (txInfo) => {
        try {
          // 使用交易哈希获取完整的交易数据
          const tx = await provider.getTransaction(txInfo.hash);
          console.log('获取到的交易数据:', tx);

          if (!tx) {
            console.log('无法获取交易数据:', txInfo.hash);
            return null;
          }

          // 检查交易是否与指定地址相关
          // const isRelevant = tx.from?.toLowerCase() === address.toLowerCase() ||
          //   tx.to?.toLowerCase() === address.toLowerCase();

          // if (!isRelevant) {
          //   console.log('交易与地址不相关，跳过:', tx.hash, 'from:', tx.from, 'to:', tx.to, 'target:', address);
          //   return null;
          // }

          return {
            id: `${txInfo.blockNumber}-${tx.nonce}-${tx.from?.slice(0, 8)}`,
            timestamp: new Date(Number(txInfo.timestamp) * 1000).toLocaleString(),
            type: '区块链交易',
            description: `区块 #${txInfo.blockNumber} 中的交易`,
            txHash: tx.hash,
            blockNumber: txInfo.blockNumber,
            from: tx.from,
            to: tx.to,
            value: tx.value ? ethers.formatEther(tx.value) : '0',
            gasPrice: tx.gasPrice ? ethers.formatEther(tx.gasPrice) : '0',
            nonce: tx.nonce,
            gasLimit: tx.gasLimit?.toString() || '0'
          };
        } catch (error) {
          console.error('获取交易详情失败:', error);
          return null;
        }
      });

      const transactions = await Promise.all(transactionPromises);
      const validTransactions = transactions.filter(tx => tx !== null);

      console.log(`地址 ${address} 的相关交易数量:`, validTransactions.length);

      // 保持自然的区块顺序，不按时间排序
      console.log('有效交易数量:', validTransactions.length);
      console.log('交易记录（按区块顺序）:', validTransactions.map(tx => ({
        blockNumber: tx.blockNumber,
        timestamp: tx.timestamp,
        hash: tx.txHash.slice(0, 10) + '...',
        time: new Date(tx.timestamp).toLocaleString()
      })));

      return validTransactions;

    } catch (error) {
      console.error('获取区块链记录失败:', error);
      message.error('获取区块链记录失败: ' + error.message);
      return [];
    } finally {
      setLoadingRecords(false);
    }
  };

  // 添加记录（保留原有功能，用于实时记录）
  const addRecord = (record) => {
    const newRecord = {
      ...record,
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleString(),
    };
    setRecords([newRecord, ...records]);
  };

  // 格式化钱包地址显示
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 切换账户
  const handleSwitchAccount = async (accountIndex) => {
    try {
      const newAddress = accounts[accountIndex];
      console.log('App: 手动切换账户:', newAddress);
      setWalletAddress(newAddress);
      setCurrentAccountIndex(accountIndex);
      await updateBalance(newAddress);
      message.success('账户切换成功！');

      // 强制触发一次状态更新，确保子组件能收到变化
      setTimeout(() => {
        setWalletAddress(prev => {
          console.log('App: 强制更新walletAddress:', prev, '->', newAddress);
          return newAddress;
        });

        // 获取新账户的区块链记录
        setTimeout(async () => {
          try {
            console.log('账户切换后开始获取交易记录...');
            const blockchainRecords = await fetchBlockchainRecords(newAddress);
            if (blockchainRecords.length > 0) {
              setRecords(blockchainRecords);
              console.log('账户切换后获取到区块链记录:', blockchainRecords.length, '条');
            } else {
              console.log('账户切换后未获取到区块链记录，尝试获取历史记录...');
              // 如果区块链记录为空，尝试获取历史记录
              const historyRecords = await fetchSepoliaHistory(newAddress);
              if (historyRecords.length > 0) {
                setRecords(historyRecords);
                console.log('账户切换后获取到历史记录:', historyRecords.length, '条');
              } else {
                console.log('账户切换后未获取到任何记录');
              }
            }
          } catch (error) {
            console.error('账户切换后获取记录失败:', error);
          }
        }, 500); // 减少延迟到500ms
      }, 50);
    } catch (error) {
      message.error('账户切换失败: ' + error.message);
    }
  };

  // 刷新余额
  const handleRefreshBalance = async () => {
    if (walletAddress) {
      await updateBalance(walletAddress);
      message.success('余额已刷新！');
    }
  };

  // 刷新区块链记录
  const handleRefreshRecords = async () => {
    if (walletAddress) {
      message.loading('正在从Sepolia测试网获取交易记录...', 0);
      
      try {
        // 获取区块链记录
        const blockchainRecords = await fetchBlockchainRecords(walletAddress);
        
        console.log('区块链记录数量:', blockchainRecords.length);
        
        if (blockchainRecords.length > 0) {
          setRecords(blockchainRecords);
          message.destroy();
          message.success(`成功获取 ${blockchainRecords.length} 条交易记录！`);
        } else {
          message.destroy();
          message.info('Sepolia测试网中暂无相关交易记录');
        }
      } catch (error) {
        message.destroy();
        message.error('获取交易记录失败: ' + error.message);
      }
    } else {
      message.error('请先连接钱包');
    }
  };

  // 生成头像
  const generateAvatar = (address) => {
    if (!address) return <UserOutlined />;

    // 使用地址生成确定性颜色
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#87d068'];
    const colorIndex = parseInt(address.slice(2, 10), 16) % colors.length;

    return (
      <Avatar
        style={{ backgroundColor: colors[colorIndex] }}
        size="large"
      >
        {address.slice(2, 4).toUpperCase()}
      </Avatar>
    );
  };

  // 账户菜单项
  const accountMenuItems = [
    // 账户列表
    ...accounts.map((account, index) => ({
      key: `account-${index}`,
      label: (
        <Space>
          {generateAvatar(account)}
          <div>
            <div>{formatAddress(account)}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {index === currentAccountIndex ? '当前账户' : '点击切换'}
            </Text>
          </div>
        </Space>
      ),
      onClick: () => handleSwitchAccount(index),
    })),
    // 分隔线
    { type: 'divider' },
    // 网络切换按钮
    {
      key: 'switch-network',
      label: (
        <Space>
          <SwapOutlined />
          <span>切换到Sepolia测试网</span>
        </Space>
      ),
      onClick: async () => {
        try {
          message.loading('正在切换到Sepolia测试网...', 0);
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia的Chain ID
          });
          message.destroy();
          message.success('已切换到Sepolia测试网！');
          // 刷新网络信息
          await updateNetworkInfo();
          // 自动刷新交易记录
          setTimeout(() => {
            handleRefreshRecords();
          }, 1000);
        } catch (error) {
          message.destroy();
          if (error.code === 4902) {
            // 网络不存在，尝试添加
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Testnet',
                  nativeCurrency: {
                    name: 'Sepolia ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://sepolia.infura.io/v3/28b48ace2abf40e4ad15359cf9e3a39d'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io/'],
                }],
              });
              message.success('Sepolia测试网添加成功！');
              // 自动刷新交易记录
              setTimeout(() => {
                handleRefreshRecords();
              }, 1000);
            } catch (addError) {
              message.error('添加Sepolia测试网失败: ' + addError.message);
            }
          } else {
            message.error('切换到Sepolia测试网失败: ' + error.message);
          }
        }
      },
    },
    // 添加网络状态检查按钮
    {
      key: 'check-network',
      label: (
        <Space>
          <SwapOutlined />
          <span>检查当前网络状态</span>
        </Space>
      ),
      onClick: async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          const latestBlock = await provider.getBlockNumber();
          
          let networkName = '未知网络';
          if (network.chainId === BigInt(11155111)) {
            networkName = 'Sepolia测试网';
          } else if (network.chainId === BigInt(1)) {
            networkName = '以太坊主网';
          } else if (network.chainId === BigInt(5)) {
            networkName = 'Goerli测试网';
          } else if (network.chainId === BigInt(1337)) {
            networkName = '本地网络';
          }
          
          message.info(`当前网络: ${networkName} (Chain ID: ${network.chainId})\n最新区块: #${latestBlock}`);
          
          // 如果在Sepolia网络上，自动刷新记录
          if (network.chainId === BigInt(11155111)) {
            setTimeout(() => {
              handleRefreshRecords();
            }, 500);
          }
        } catch (error) {
          message.error('网络状态检查失败: ' + error.message);
        }
      },
    },
    // 刷新账户按钮
    {
      key: 'refresh-accounts',
      label: (
        <Space>
          <ReloadOutlined />
          <span>刷新账户列表</span>
        </Space>
      ),
      onClick: getAllAccounts,
    },
    // 请求更多账户权限
    {
      key: 'request-accounts',
      label: (
        <Space>
          <UserOutlined />
          <span>请求账户权限</span>
        </Space>
      ),
      onClick: requestAccounts,
    }
  ];

  // Tab项目配置
  const tabItems = [
    {
      key: 'transfer',
      label: (
        <span>
          <WalletOutlined style={{ marginRight: 8 }} />
          转账方式
        </span>
      ),
      children: (
        <TransferMethod
          network={network}
          walletAddress={walletAddress}
          onRecord={addRecord}
        />
      ),
    },
    {
      key: 'log',
      label: (
        <span>
          <WalletOutlined style={{ marginRight: 8 }} />
          日志方式
        </span>
      ),
      children: (
        <LogMethod
          network={network}
          walletAddress={walletAddress}
          onRecord={addRecord}
        />
      ),
    },
    {
      key: 'redpacket',
      label: (
        <span>
          <GiftOutlined style={{ marginRight: 8 }} />
          抢红包
        </span>
      ),
      children: (
        <RedPacketMethod
          walletAddress={walletAddress}
          provider={provider}
          signer={signer}
          networkInfo={networkInfo}
        />
      ),
    },
    {
      key: 'accounts',
      label: (
        <span>
          <UserOutlined style={{ marginRight: 8 }} />
          账户管理
        </span>
      ),
      children: (
        <div style={{ padding: '20px 0' }}>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            管理您的所有账户，查看余额，切换账户等操作
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {accounts.map((account, index) => (
              <Card
                key={account}
                size="small"
                style={{
                  border: index === currentAccountIndex ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  backgroundColor: index === currentAccountIndex ? '#f0f8ff' : 'white'
                }}
              >
                <Card.Meta
                  avatar={generateAvatar(account)}
                  title={
                    <Space>
                      <span>{index === currentAccountIndex ? '当前账户' : `账户 ${index + 1}`}</span>
                      {index === currentAccountIndex && (
                        <Text type="success" style={{ fontSize: '12px' }}>
                          ✓ 已选择
                        </Text>
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: '8px' }}>
                        <Text code style={{ fontSize: '12px' }}>{account}</Text>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <Text type="secondary">余额: {parseFloat(ethBalance).toFixed(6)} ETH</Text>
                      </div>
                      <Space>
                        <Button
                          size="small"
                          type={index === currentAccountIndex ? "primary" : "default"}
                          onClick={() => handleSwitchAccount(index)}
                          disabled={index === currentAccountIndex}
                        >
                          {index === currentAccountIndex ? '当前账户' : '切换到此账户'}
                        </Button>
                        <Button
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => navigator.clipboard.writeText(account)}
                        >
                          复制地址
                        </Button>
                      </Space>
                    </div>
                  }
                />
              </Card>
            ))}
          </div>
          <Divider />
          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={getAllAccounts}
              >
                刷新账户列表
              </Button>
              <Button
                icon={<UserOutlined />}
                onClick={requestAccounts}
              >
                请求账户权限
              </Button>
            </Space>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="logo">
          <WalletOutlined style={{ 
            marginRight: 12, 
            fontSize: '20px',
            color: '#1890ff'
          }} />
          <span style={{ 
            fontSize: '18px',
            fontWeight: 600,
            color: 'white'
          }}>
            数据上链系统
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* 网络状态显示 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '4px 12px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ 
              width: 6, 
              height: 6, 
              borderRadius: '50%', 
              backgroundColor: isConnected ? '#52c41a' : '#ff4d4f',
              marginRight: '8px'
            }} />
            <Text style={{ 
              color: 'white', 
              fontSize: '12px',
              fontWeight: 500
            }}>
              {isConnected ? (
                networkInfo && networkInfo.name ? networkInfo.name : 
                network === 'test' ? 'Sepolia测试网' : 
                network === 'mainnet' ? '以太坊主网' : 
                network === 'local' ? '本地网络' : '未知网络'
              ) : '未连接'}
            </Text>
          </div>
          
          {/* 账户信息 */}
          {isConnected && (
            <Dropdown
              menu={{ items: accountMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                type="text"
                style={{
                  height: 'auto',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              >
                {generateAvatar(walletAddress)}
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', lineHeight: '1.2', color: 'white' }}>
                    {formatAddress(walletAddress)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.2' }}>
                    {ethBalance} ETH
                  </div>
                </div>
                <DownOutlined style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }} />
              </Button>
            </Dropdown>
          )}
          
          {/* 连接钱包按钮 */}
          {!isConnected && (
            <Button
              type="primary"
              icon={<WalletOutlined />}
              onClick={handleConnectWallet}
              loading={loading}
              style={{
                background: '#1890ff',
                border: 'none',
                borderRadius: '8px',
                height: '36px',
                padding: '0 20px'
              }}
            >
              连接钱包
            </Button>
          )}
        </div>
      </Header>

      <Content className="app-content">
        <div className="main-content">
          <Title level={2}>数据上链系统</Title>

          {!isConnected ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <WalletOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
              <p>请先连接钱包以使用系统功能</p>
              <Button type="primary" size="large" onClick={handleConnectWallet} loading={loading}>
                连接钱包
              </Button>
            </div>
          ) : (
            <>
              {/* 使用Tabs组件 */}
              <Tabs
                defaultActiveKey="transfer"
                items={tabItems}
                className="main-tabs"
                size="large"
                tabPosition="top"
                style={{ marginTop: 24 }}
              />
            </>
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default App;
