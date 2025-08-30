import React, { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Button, message, Space, Typography, Alert, List, Spin } from 'antd';
import { SendOutlined, WalletOutlined, MessageOutlined, ReloadOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;

const TransferMethod = ({ network, walletAddress, onRecord }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState('0');
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // 监听walletAddress变化，更新余额
  useEffect(() => {
    if (walletAddress) {
      updateBalance();
      fetchTransferRecords();
    } else {
      setCurrentBalance('0');
      setRecords([]);
    }
  }, [walletAddress]);

  // 更新余额
  const updateBalance = async () => {
    if (!walletAddress || !window.ethereum) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(walletAddress);
      const balanceInEth = ethers.formatEther(balance);
      setCurrentBalance(balanceInEth);
    } catch (error) {
      console.error('获取余额失败:', error);
      setCurrentBalance('0');
    }
  };

  // 获取转账记录
  const fetchTransferRecords = async () => {
    if (!walletAddress) return;
    
    setLoadingRecords(true);
    try {
      // 使用Etherscan API获取交易记录
      const apiUrl = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=USAKI6Z2INSM5XRW1JTEUZB753473IM37Q`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.status === '1' && data.result) {
        setRecords(data.result);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('获取转账记录失败:', error);
      setRecords([]);
    } finally {
      setLoadingRecords(false);
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

    const { recipientAddress, amount, message: transferMessage } = values;

    // 验证地址
    if (!ethers.isAddress(recipientAddress)) {
      message.error('请输入有效的接收地址');
      return;
    }

    // 验证金额
    if (parseFloat(amount) <= 0) {
      message.error('转账金额必须大于0');
      return;
    }

    if (parseFloat(amount) > parseFloat(currentBalance)) {
      message.error('余额不足');
      return;
    }

    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 准备交易数据
      const txData = {
        to: recipientAddress,
        value: ethers.parseEther(amount.toString())
      };

      // 如果有留言，添加到交易数据中
      if (transferMessage && transferMessage.trim()) {
        const messageBytes = ethers.toUtf8Bytes(transferMessage.trim());
        txData.data = messageBytes;
      }

      // 发送交易
      const tx = await signer.sendTransaction(txData);
      message.loading('交易已发送，等待确认...', 0);

      // 等待交易确认
      const receipt = await tx.wait();
      message.destroy();
      message.success('转账成功！');

      // 记录交易
      onRecord({
        type: '转账方式',
        description: `成功转账 ${amount} ETH 到 ${recipientAddress}`,
        txHash: tx.hash,
        amount: amount,
        recipient: recipientAddress,
        message: transferMessage
      });

      // 更新余额和记录
      await updateBalance();
      await fetchTransferRecords();
      
      // 重置表单
      form.resetFields();

    } catch (error) {
      message.destroy();
      console.error('转账失败:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        message.error('用户取消了交易');
      } else if (error.message.includes('insufficient funds')) {
        message.error('余额不足');
      } else {
        message.error('转账失败: ' + error.message);
      }

      onRecord({
        type: '转账方式',
        description: `转账失败：${error.message}`,
        amount: amount,
        recipient: recipientAddress,
        message: transferMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>
        <SendOutlined style={{ marginRight: 8, color: '#1890ff' }} />
        转账功能
      </Title>

      <Paragraph style={{ color: '#666', marginBottom: '24px' }}>
        向其他地址发送ETH，支持添加留言数据。
      </Paragraph>

      {/* 余额显示 */}
      <Card title="钱包余额" style={{ marginBottom: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={2} style={{ color: '#52c41a', margin: 0 }}>
            {currentBalance} ETH
          </Title>
          <Text type="secondary">当前钱包余额</Text>
        </div>
      </Card>

      {/* 转账表单 */}
      <Card title="发送转账" style={{ marginBottom: '20px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleTransfer}
          initialValues={{
            recipientAddress: '',
            amount: '',
            message: ''
          }}
        >
          <Form.Item
            label="接收地址"
            name="recipientAddress"
            rules={[
              { required: true, message: '请输入接收地址' },
              { 
                validator: (_, value) => {
                  if (value && !ethers.isAddress(value)) {
                    return Promise.reject(new Error('请输入有效的以太坊地址'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input
              placeholder="0x..."
              prefix={<WalletOutlined />}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="转账金额 (ETH)"
            name="amount"
            rules={[
              { required: true, message: '请输入转账金额' },
              { 
                validator: (_, value) => {
                  if (value && parseFloat(value) <= 0) {
                    return Promise.reject(new Error('金额必须大于0'));
                  }
                  if (value && parseFloat(value) > parseFloat(currentBalance)) {
                    return Promise.reject(new Error('余额不足'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              placeholder="0.01"
              min="0"
              step="0.001"
              precision={6}
              style={{ width: '100%' }}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="留言 (可选)"
            name="message"
            rules={[
              { max: 100, message: '留言不能超过100个字符' }
            ]}
          >
            <TextArea
              placeholder="添加转账留言..."
              prefix={<MessageOutlined />}
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
              disabled={!walletAddress}
            >
              {loading ? '处理中...' : '发送转账'}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 转账记录 */}
      <Card 
        title="转账记录" 
        style={{ marginBottom: '20px' }}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchTransferRecords}
            loading={loadingRecords}
            size="small"
          >
            刷新
          </Button>
        }
      >
        {loadingRecords ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#666' }}>正在获取转账记录...</div>
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <div>暂无转账记录</div>
          </div>
        ) : (
          <List
            dataSource={records}
            renderItem={(item, index) => (
              <List.Item
                style={{
                  padding: '12px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  background: '#fafafa'
                }}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Text strong style={{ color: '#1890ff' }}>
                      #{index + 1} - {item.hash.slice(0, 10)}...
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(Number(item.timeStamp) * 1000).toLocaleString()}
                    </Text>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', fontSize: '12px' }}>
                    <div>
                      <Text type="secondary">交易哈希:</Text>
                      <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {item.hash}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">发送方:</Text>
                      <div style={{ fontFamily: 'monospace' }}>
                        {item.from}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">接收方:</Text>
                      <div style={{ fontFamily: 'monospace' }}>
                        {item.to}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">金额:</Text>
                      <div style={{ fontWeight: 500 }}>
                        {ethers.formatEther(item.value)} ETH
                      </div>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 学习说明 */}
      <Card title="学习要点" size="small">
        <div style={{ fontSize: '12px', color: '#666' }}>
          <p><strong>关键函数：</strong></p>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>updateBalance：获取和更新钱包余额</li>
            <li>handleTransfer：处理转账逻辑</li>
            <li>fetchTransferRecords：获取转账记录</li>
            <li>ethers.parseEther：将ETH转换为Wei</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default TransferMethod;