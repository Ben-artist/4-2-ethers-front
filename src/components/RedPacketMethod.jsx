import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  message,
  Space,
  Typography,
  Alert,
  Row,
  Col,
  Tag,
  Descriptions,
  Spin
} from 'antd';
import {
  GiftOutlined,
  WalletOutlined,
  FireOutlined,
  MinusOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { ethers } from 'ethers';
import contractABI from '../redPacket.json';

const { Title, Text, Paragraph } = Typography;

const RedPacketMethod = ({ walletAddress, provider, signer, networkInfo }) => {
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [contractInfo, setContractInfo] = useState({
    count: 0,
    balance: '0'
  });
  const [userHasGrabbed, setUserHasGrabbed] = useState({});

  // 合约地址和ABI
  const CONTRACT_ADDRESS = '0x67Ef630540CE16053F01142A8154a0C0Cf7f0d7C';
  const CONTRACT_ABI = contractABI.abi;

  // 初始化合约
  useEffect(() => {
    if (provider && signer) {
      initializeContract();
    }
  }, [provider, signer]);

  // 加载合约信息
  useEffect(() => {
    if (contract) {
      loadContractInfo();
    }
  }, [contract, walletAddress]);

  // 初始化合约实例
  const initializeContract = async () => {
    try {
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contractInstance);
    } catch (error) {
      console.error('初始化合约失败:', error);
      message.error('初始化合约失败');
    }
  };

  // 加载合约信息
  const loadContractInfo = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const [count, balance] = await Promise.all([
        contract.count(),
        contract.getBalance()
      ]);

      if (walletAddress) {
        try {
          const userGrabbed = await contract.hasGrap(walletAddress);
          console.log(`地址 ${walletAddress} 是否已抢红包:`, userGrabbed);

          // 为当前地址更新抢红包状态
          setUserHasGrabbed(prev => ({
            ...prev,
            [walletAddress.toLowerCase()]: userGrabbed
          }));
        } catch (grabError) {
          console.error('检查用户是否已抢红包失败:', grabError);
          setUserHasGrabbed(prev => ({
            ...prev,
            [walletAddress.toLowerCase()]: false
          }));
        }
      }

      setContractInfo({
        count: count.toString(),
        balance: ethers.formatEther(balance)
      });

      console.log('合约信息更新完成:', {
        walletAddress,
        userHasGrabbed: walletAddress ? userHasGrabbed[walletAddress.toLowerCase()] : 'N/A',
        count: count.toString()
      });
    } catch (error) {
      console.error('加载合约信息失败:', error);
      message.error('加载合约信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 抢红包
  const handleGrab = async () => {
    if (!contract || !walletAddress) {
      message.error('请先连接钱包');
      return;
    }

    // 使用已加载的状态，避免重复调用合约
    const currentAddressGrabbed = userHasGrabbed[walletAddress.toLowerCase()];
    if (currentAddressGrabbed) {
      message.error('你已经抢过红包了！');
      return;
    }
    

    try {
      setLoading(true);
      const tx = await contract.grap();
      message.loading('正在抢红包...', 0);

      await tx.wait();
      message.destroy();
      message.success('恭喜！抢红包成功！');

      // 刷新合约信息
      await loadContractInfo();
    } catch (error) {
      message.destroy();
      console.error('抢红包失败:', error);

      if (error.code === 'ACTION_REJECTED') {
        message.error('用户取消了交易');
      } else if (error.message.includes('No packets left')) {
        message.error('红包已经被抢完了！');
      } else if (error.message.includes('Already claimed')) {
        message.error('你已经抢过红包了！');
      } else {
        message.error('抢红包失败: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>
        <GiftOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
        抢红包系统
      </Title>

      <Paragraph style={{ color: '#666', marginBottom: '24px' }}>
        这是一个基于智能合约的抢红包系统，每个地址只能抢一次红包。
      </Paragraph>

      {/* 合约状态 */}
      <Card title="红包状态" style={{ marginBottom: '20px' }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ textAlign: 'center' }}>
              <Title level={4} style={{ color: '#ff4d4f', margin: 0 }}>
                {contractInfo.count}
              </Title>
              <Text type="secondary">剩余红包数量</Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ textAlign: 'center' }}>
              <Title level={4} style={{ color: '#52c41a', margin: 0 }}>
                {contractInfo.balance}
              </Title>
              <Text type="secondary">合约余额 (ETH)</Text>
            </div>
          </Col>
        </Row>

        {/* 用户状态 */}
        {walletAddress && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Tag
              color={walletAddress && userHasGrabbed[walletAddress.toLowerCase()] ? 'red' : 'green'}
              icon={walletAddress && userHasGrabbed[walletAddress.toLowerCase()] ? <MinusOutlined /> : <PlusOutlined />}
            >
              {walletAddress && userHasGrabbed[walletAddress.toLowerCase()] ? '已抢过红包' : '未抢红包'}
            </Tag>
          </div>
        )}
      </Card>

      {/* 抢红包操作 */}
      <Card title="抢红包" style={{ marginBottom: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          {!walletAddress ? (
            <Alert
              message="请先连接钱包"
              description="连接钱包后才能抢红包"
              type="warning"
              showIcon
            />
          ) : (walletAddress && userHasGrabbed[walletAddress.toLowerCase()]) ? (
            <Alert
              message="你已经抢过红包了"
              description="每个地址只能抢一次红包"
              type="info"
              showIcon
            />
          ) : parseInt(contractInfo.count) === 0 ? (
            <Alert
              message="红包已被抢完"
              description="所有红包都已经被抢走了"
              type="error"
              showIcon
            />
          ) : (
            <div>
              <Paragraph>
                当前还有 <Text strong style={{ color: '#ff4d4f' }}>{contractInfo.count}</Text> 个红包
              </Paragraph>
              <Button
                type="primary"
                size="large"
                icon={<FireOutlined />}
                onClick={handleGrab}
                loading={loading}
                style={{
                  background: 'linear-gradient(45deg, #ff4d4f, #ff7875)',
                  border: 'none',
                  height: '50px',
                  fontSize: '18px'
                }}
              >
                立即抢红包！
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 网络信息 */}
      {networkInfo && (
        <Card title="网络状态" size="small">
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="当前网络">
              {networkInfo.name || '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="网络ID">
              {networkInfo.chainId || '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="合约地址">
              <Text copyable style={{ fontFamily: 'monospace' }}>
                {CONTRACT_ADDRESS}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="钱包地址">
              {walletAddress ? (
                <Text copyable style={{ fontFamily: 'monospace' }}>
                  {walletAddress}
                </Text>
              ) : (
                '未连接'
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* 学习说明 */}
      <Card title="学习要点" size="small" style={{ marginTop: '20px' }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <p><strong>关键函数：</strong></p>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>initializeContract：初始化合约实例</li>
            <li>loadContractInfo：加载合约状态和用户状态</li>
            <li>handleGrab：处理抢红包逻辑</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default RedPacketMethod;
