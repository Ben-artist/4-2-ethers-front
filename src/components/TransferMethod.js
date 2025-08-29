import React, { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Button, message, Space, Divider, Typography, Spin, Progress } from 'antd';
import { SendOutlined, WalletOutlined, UserOutlined, MessageOutlined, ReloadOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';

const { TextArea } = Input;
const { Text, Title } = Typography;

const TransferMethod = ({ network, walletAddress, onRecord }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState('0');
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [txProgress, setTxProgress] = useState(0); // Progress bar state
  const [txStatus, setTxStatus] = useState(null); // Transaction status: null, pending, success, error

  // 监听walletAddress变化，更新余额
  useEffect(() => {
    console.log('TransferMethod: walletAddress 变化:', walletAddress);
    if (walletAddress) {
      // 延迟一点执行，确保MetaMask状态已更新
      const timer = setTimeout(() => {
        console.log('TransferMethod: 延迟执行updateBalance');
        updateBalance();
        // 自动获取交易记录
        fetchTransferRecords();
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      console.log('TransferMethod: walletAddress为空，清空余额');
      setCurrentBalance('0');
      setRecords([]);
    }
  }, [walletAddress]);

  // 添加额外的监听器，监听MetaMask账户变化
  useEffect(() => {
    if (!window.ethereum) return;
    
    const handleAccountsChanged = () => {
      console.log('TransferMethod: MetaMask账户变化事件触发');
      console.log('TransferMethod: 当前walletAddress:', walletAddress);
      
      // 延迟执行，确保MetaMask状态已更新
      setTimeout(() => {
        console.log('TransferMethod: MetaMask事件延迟执行updateBalance');
        console.log('TransferMethod: 延迟执行时的walletAddress:', walletAddress);
        updateBalance();
        // 重新获取交易记录
        if (walletAddress) {
          fetchTransferRecords();
        }
      }, 200);
    };
    
 window.ethereum.on('accountsChanged', handleAccountsChanged);
    
    // 组件初始化时立即获取余额
    if (walletAddress) {
      console.log('TransferMethod: 组件初始化，立即获取余额，地址:', walletAddress);
      setTimeout(() => {
        console.log('TransferMethod: 初始化延迟执行updateBalance');
        updateBalance();
        fetchTransferRecords();
      }, 100);
    } else {
      console.log('TransferMethod: 组件初始化，walletAddress为空');
    }
    
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [walletAddress]);

  // 获取转账相关的交易记录
  const fetchTransferRecords = async () => {
    if (!walletAddress) {
      console.log('fetchTransferRecords: walletAddress为空，跳过获取');
      return;
    }
    
    console.log('fetchTransferRecords: 开始获取转账记录，地址:', walletAddress);
    setLoadingRecords(true);
    
    try {
      // 使用Etherscan API获取交易记录
      const apiUrl = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=USAKI6Z2INSM5XRW1JTEUZB753473IM37Q`;
      console.log('API请求URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('API响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API响应数据:', data);
      
      if (data.status === '1' && data.result && Array.isArray(data.result)) {
        console.log('从Etherscan获取到交易记录:', data.result.length, '条');
        
        // 转换数据格式
        const transferRecords = data.result.map(tx => ({
          id: `etherscan-${tx.hash}`,
          timestamp: new Date(Number(tx.timeStamp) * 1000).toLocaleString(),
          type: '转账交易',
          description: `区块 #${tx.blockNumber} 中的转账`,
          txHash: tx.hash,
          blockNumber: tx.blockNumber,
          from: tx.from,
          to: tx.to,
          value: tx.value ? (Number(tx.value) / Math.pow(10, 18)).toFixed(8) : '0',
          gasUsed: tx.gasUsed,
          nonce: tx.nonce,
          gasLimit: tx.gasLimit || '0'
        }));
        
        console.log('转换后的转账记录:', transferRecords);
        
        // 设置记录状态
        setRecords(transferRecords);
        message.success(`成功获取 ${transferRecords.length} 条转账记录！`);
        
      } else if (data.status === '0') {
        console.log('API返回错误:', data.message);
        if (data.message.includes('No transactions found')) {
          console.log('该地址没有交易记录');
          setRecords([]);
          message.info('该地址在Sepolia网络上没有交易记录');
        } else {
          setRecords([]);
          message.warning('获取交易记录时遇到问题: ' + data.message);
        }
      } else {
        console.log('API响应格式异常:', data);
        setRecords([]);
        message.error('API响应格式异常');
      }
      
    } catch (error) {
      console.error('获取转账记录失败:', error);
      message.error('获取转账记录失败: ' + error.message);
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  // 更新当前账户余额
  const updateBalance = async () => {
    if (!window.ethereum) return;
    
    try {
      console.log('TransferMethod: updateBalance开始执行');
      console.log('TransferMethod: 传入的walletAddress:', walletAddress);
      
      // 优先使用传入的walletAddress，如果没有则获取当前签名者地址
      let targetAddress = walletAddress;
      
      if (!targetAddress) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        console.log('TransferMethod: 网络:', network.name, network.chainId);
        const signer = await provider.getSigner();
        targetAddress = await signer.getAddress();
        console.log('TransferMethod: 从signer获取地址:', targetAddress);
      }
      
      if (!targetAddress) {
        console.log('TransferMethod: 无法获取目标地址');
        setCurrentBalance('0');
        return;
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      console.log('TransferMethod: 网络:', network.name, network.chainId);
      const balance = await provider.getBalance(targetAddress);
      const formattedBalance = ethers.formatEther(balance);
      
      console.log('TransferMethod: 更新余额 - 目标地址:', targetAddress);
      console.log('TransferMethod: 更新余额 - 余额:', formattedBalance);
      console.log('TransferMethod: 原始余额数据:', balance.toString());
      
      setCurrentBalance(formattedBalance);
      
    } catch (error) {
      console.error('TransferMethod: 获取余额失败:', error);
      setCurrentBalance('0');
    }
  };

  // 处理转账
  const handleTransfer = async (values) => {
    if (!window.ethereum) {
      message.error('请安装MetaMask钱包');
      return;
    }

    if (!walletAddress) {
      message.error('请先连接钱包');
      return;
    }

    setLoading(true);
    setTxProgress(0);
    setTxStatus('pending');
    
    try {
      // 创建provider和signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // 获取当前签名者地址（确保是最新的）
      const currentSignerAddress = await signer.getAddress();
      
      // 验证地址格式
      if (!ethers.isAddress(values.recipientAddress)) {
        throw new Error('无效的收款地址');
      }

      // 验证不能转账给自己
      if (values.recipientAddress.toLowerCase() === currentSignerAddress.toLowerCase()) {
        throw new Error('不能转账给自己');
      }

      // 验证金额
      if (values.amount <= 0) {
        throw new Error('转账金额必须大于0');
      }

      // 获取当前余额
      const balance = await provider.getBalance(currentSignerAddress);
      const transferAmount = ethers.parseEther(values.amount.toString());
      console.log('TransferMethod: 转账验证 - 当前签名者地址:', currentSignerAddress);
      console.log('TransferMethod: 转账验证 - 当前余额:', balance.toString());
      console.log('TransferMethod: 转账验证 - 转账金额:', transferAmount.toString());
      console.log('TransferMethod: 转账验证 - 传入的walletAddress:', walletAddress);
      if (balance < transferAmount) {
        throw new Error('余额不足');
      }

      setTxProgress(20); // Transaction initiated

      // 确保地址格式正确
      const recipientAddress = ethers.getAddress(values.recipientAddress);
      console.log('转账到地址:', recipientAddress);
      
      // 构建交易
      const tx = {
        to: recipientAddress,
        value: transferAmount,
        data: values.message ? ethers.toUtf8Bytes(values.message) : '0x'
      };

      console.log('发送交易:', {
        from: currentSignerAddress,
        to: values.recipientAddress,
        value: ethers.formatEther(transferAmount),
        data: values.message || '无'
      });

      // 发送交易
      const transaction = await signer.sendTransaction(tx);
      setTxProgress(50); // Transaction sent
      
      // 等待交易确认
      const receipt = await transaction.wait();
      setTxProgress(100);
      setTxStatus('success');

      // 添加成功记录
      onRecord({
        type: '转账方式',
        description: `成功转账 ${values.amount} ETH 从 ${formatAddress(currentSignerAddress)} 到 ${formatAddress(recipientAddress)}${values.message ? `，留言：${values.message}` : ''}`,
        txHash: receipt.hash,
        amount: values.amount,
        from: currentSignerAddress,
        recipient: recipientAddress,
        message: values.message
      });

      message.success('转账成功！');
      form.resetFields();
      
      // 更新余额
      await updateBalance();
      
    } catch (error) {
      console.error('转账失败:', error);
      setTxProgress(100);
      setTxStatus('error');

      // 添加失败记录
      onRecord({
        type: '转账方式',
        description: `转账失败：${error.message}`,
        amount: values.amount,
        from: walletAddress,
        recipient: values.recipientAddress,
        message: values.message
      });

      message.error('转账失败: ' + error.message);
    } finally {
      setLoading(false);
      // Reset progress after a short delay
      setTimeout(() => {
        setTxProgress(0);
        setTxStatus(null);
      }, 3000);
    }
  };

  // 格式化地址显示
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 验证地址
  const validateAddress = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('请输入收款地址'));
    }
    if (!ethers.isAddress(value)) {
      return Promise.reject(new Error('请输入有效的以太坊地址'));
    }
    
    try {
      // 尝试获取正确的地址格式
      const formattedAddress = ethers.getAddress(value);
      console.log('地址格式验证通过:', formattedAddress);
    } catch (error) {
      return Promise.reject(new Error('地址格式不正确，请检查地址'));
    }
    
    if (value.toLowerCase() === walletAddress.toLowerCase()) {
      return Promise.reject(new Error('不能转账给自己'));
    }
    return Promise.resolve();
  };

  return (
    <Card 
      title={
        <Space>
          <SendOutlined style={{ color: '#1890ff' }} />
          转账方式
        </Space>
      }
      extra={
        <div style={{ fontSize: '12px', color: '#666' }}>
          <WalletOutlined /> 当前网络: {network === 'test' ? '测试网' : network === 'local' ? '本地' : '主网'}
        </div>
      }
    >
      {/* 交易进度条 */}
      {txStatus && (
        <div style={{ marginBottom: 16 }}>
          <Progress
            percent={txProgress}
            status={txStatus === 'error' ? 'exception' : txStatus === 'success' ? 'success' : 'active'}
            showInfo={true}
            format={() => {
              if (txStatus === 'pending') return '交易处理中...';
              if (txStatus === 'success') return '交易成功';
              if (txStatus === 'error') return '交易失败';
              return '';
            }}
          />
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleTransfer}
        initialValues={{
          amount: 0.001,
          message: ''
        }}
      >
        {/* 当前账户信息 */}
        <Form.Item label="当前账户">
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '6px',
            border: '1px solid #d9d9d9'
          }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <UserOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {walletAddress ? formatAddress(walletAddress) : '未连接钱包'}
                </span>
                              <span style={{ color: '#666' }}>
                余额: {parseFloat(currentBalance).toFixed(6)} ETH
              </span>
              <span style={{ fontSize: '11px', color: '#999' }}>
                (实时)
              </span>
              </Space>
              {walletAddress && (
                <div style={{ fontSize: '12px', color: '#999' }}>
                  <Space>
                    <span>完整地址: {walletAddress}</span>
                    <Button 
                      size="small" 
                      type="link" 
                      onClick={updateBalance}
                      style={{ padding: 0, height: 'auto' }}
                    >
                      刷新余额
                    </Button>
                  </Space>
                </div>
              )}
            </Space>
          </div>
        </Form.Item>

        <Form.Item
          label="转账说明"
          name="description"
          rules={[{ required: true, message: '请输入转账说明' }]}
        >
          <Input 
            placeholder="请输入转账说明，例如：支付服务费用"
            prefix={<MessageOutlined />}
          />
        </Form.Item>

        <Form.Item
          label="转账金额 (ETH)"
          name="amount"
          rules={[
            { required: true, message: '请输入转账金额' },
            { type: 'number', min: 0.0001, message: '金额必须大于0.0001 ETH' }
          ]}
        >
          <InputNumber style={{ width: '100%' }}
            placeholder="0.001"
            precision={6}
            min={0.0001}
            step={0.001}
            addonAfter="ETH"
          />
        </Form.Item>

        <Form.Item
          label="收款账户地址"
          name="recipientAddress"
          rules={[
            { required: true, message: '请输入收款地址' },
            { validator: validateAddress }
          ]}
        >
          <Input 
            placeholder="0x..."
            prefix={<UserOutlined />}
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>

        <Form.Item
          label="数据留言 (可选)"
          name="message"
          extra="可以添加转账备注信息，将作为交易数据上链"
        >
          <TextArea 
            placeholder="请输入留言内容..."
            rows={3}
            maxLength={100}
            showCount
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SendOutlined />}
            size="large"
            style={{ width: '100%' }}
          >
            {loading ? '处理中...' : '确认转账'}
          </Button>
        </Form.Item>
      </Form>

      <Divider />

      {/* 转账记录显示区域 */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ margin: 0 }}>
            <ReloadOutlined style={{ marginRight: 8 }} /> 最近转账记录
          </div>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchTransferRecords}
            loading={loadingRecords}
            size="small"
          >
            刷新记录
          </Button>
        </div>

        {/* 调试信息 */}
        <div style={{ 
          marginBottom: 16, 
          padding: '8px 12px', 
          background: '#f6f8fa', 
          border: '1px solid #e1e4e8', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <Text type="secondary">状态信息:</Text>
          <div style={{ marginTop: '4px' }}>
            <div>加载状态: {loadingRecords ? '正在获取...' : '已完成'}</div>
            <div>记录数量: {records.length} 条</div>
            <div>钱包状态: {walletAddress ? '已连接' : '未连接'}</div>
          </div>
        </div>

        {loadingRecords ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#666' }}>正在获取转账记录...</div>
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <WalletOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <div>暂无转账记录</div>
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              可能原因：该地址在最近50个区块中没有相关交易
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              共找到 {records.length} 条相关转账记录
            </Text>
          </div>
        )}

        {records.length > 0 && (
          <Space direction="vertical" style={{ width: '100%' }}>
            {records.map(record => (
              <Card 
                key={record.id} 
                size="small" 
                style={{ 
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  background: '#fafafa'
                }}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Text strong style={{ color: '#1890ff' }}>
                      {record.type}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {record.timestamp}
                    </Text>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '12px' }}>
                    <div>
                      <Text type="secondary">交易哈希:</Text>
                      <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {record.txHash}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">区块号:</Text>
                      <div style={{ fontFamily: 'monospace' }}>
                        #{record.blockNumber}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">转账金额:</Text>
                      <div style={{ fontWeight: 500, color: '#52c41a' }}>
                        {record.value} ETH
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">发送方:</Text>
                      <div style={{ fontFamily: 'monospace' }}>
                        {formatAddress(record.from)}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">接收方:</Text>
                      <div style={{ fontFamily: 'monospace' }}>
                        {formatAddress(record.to)}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">Gas使用:</Text>
                      <div>
                        {record.gasUsed}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        )}
      </div>
    </Card>
  );
};

export default TransferMethod;