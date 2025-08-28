import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Space, Divider, Alert, List, Spin, Typography } from 'antd';
import { FileTextOutlined, WalletOutlined, DatabaseOutlined, ReloadOutlined, CloudOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import { gql, request } from 'graphql-request';
import contractABI from '../Test.json';
import { getContractAddress } from '../config/contracts';

const { TextArea } = Input;
const { Text, Title } = Typography;

const LogMethod = ({ network, walletAddress, onRecord }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [subgraphData, setSubgraphData] = useState([]);
  const [loadingSubgraph, setLoadingSubgraph] = useState(false);

  // GraphQL查询配置
  const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/119065/ethers/version/latest';
  const SUBGRAPH_HEADERS = { 
    Authorization: 'Bearer 2d9b718c1cecb3c6b1766dbeb5b6b077' 
  };

  // GraphQL查询语句
  const HELLO_TOS_QUERY = gql`
    {
      helloTos(first: 10, orderBy: blockTimestamp, orderDirection: desc) {
        id
        name
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `;

  // 从The Graph获取数据
  const fetchSubgraphData = async () => {
    setLoadingSubgraph(true);
    try {
      console.log('正在从The Graph获取数据...');
      const data = await request(SUBGRAPH_URL, HELLO_TOS_QUERY, {}, SUBGRAPH_HEADERS);
      console.log('GraphQL查询结果:', data);
      
      if (data && data.helloTos) {
        setSubgraphData(data.helloTos);
        message.success(`成功获取 ${data.helloTos.length} 条helloTos记录！`);
      } else {
        setSubgraphData([]);
        message.info('未找到helloTos记录');
      }
    } catch (error) {
      console.error('GraphQL查询失败:', error);
      message.error('获取The Graph数据失败: ' + error.message);
      setSubgraphData([]);
    } finally {
      setLoadingSubgraph(false);
    }
  };

  // 组件加载时自动获取数据
  useEffect(() => {
    fetchSubgraphData();
  }, []);

  // 从配置文件中获取合约地址
  const getContractAddressLocal = () => {
    return getContractAddress('TEST_CONTRACT');
  };

  // 处理日志写入
  const handleWriteLog = async (values) => {
    if (!window.ethereum) {
      message.error('请安装MetaMask钱包');
      return;
    }

    setLoading(true);

    try {
      // 创建provider和signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 获取合约地址
      const address = getContractAddressLocal();
      console.log('合约地址:', address);

      // 创建合约实例
      const contract = new ethers.Contract(address, contractABI.abi, signer);
      console.log('合约实例:', contract);

      if (values.logType === 'hello') {
        // 调用sayHello函数
        console.log('调用sayHello函数...');

        // 直接调用合约函数（简化版本）
        const tx = await contract.sayHello();
        console.log('交易已发送:', tx.hash);

        // 记录成功
        onRecord({
          type: '日志方式',
          description: `成功调用合约sayHello()函数`,
          txHash: tx.hash,
          logType: 'hello'
        });

        message.success('日志写入成功！');

      } else if (values.logType === 'helloTo') {
        // 调用sayHelloTo函数
        if (!values.logContent.trim()) {
          throw new Error('请输入要问候的名字');
        }

        console.log('调用sayHelloTo函数，参数:', values.logContent.trim());

        // 直接调用合约函数（简化版本）
        const tx = await contract.sayHelloTo(values.logContent.trim());
        console.log('交易已发送:', tx.hash);

        // 记录成功
        onRecord({
          type: '日志方式',
          description: `成功调用合约sayHelloTo("${values.logContent}")函数`,
          txHash: tx.hash,
          logType: 'helloTo',
          content: values.logContent
        });

        message.success('日志写入成功！');
      }

      form.resetFields();

    } catch (error) {
      console.error('日志写入失败:', error);

      onRecord({
        type: '日志方式',
        description: `日志写入失败：${error.message}`,
        logType: values.logType,
        content: values.logContent
      });

      message.error('日志写入失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 测试合约连接
  const testContractConnection = async () => {
    try {
      const address = "0x12C7d98417C7AD4273ee900132Da27B56eC5C4a1";
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []); // 触发 MetaMask 连接
      const contract = new ethers.Contract(address, [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"string","name":"name","type":"string"}],"name":"HelloTo","type":"event"},{"inputs":[],"name":"sayHello","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"}],"name":"sayHelloTo","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"nonpayable","type":"function"}], provider);
      const network = await provider.getNetwork();
      console.log("Network:", network.name, network.chainId); // 应为 "sepolia" 和 1115
      console.log('测试合约连接，地址:', address, contract);

      // 尝试调用只读函数
      try {
        // 使用staticCall来测试只读函数，不需要等待交易确认
        const result = await contract.sayHello();
        console.log('测试调用成功，返回值:', result);
        message.success(`合约连接成功！测试调用返回：${result}`);
      } catch (callError) {
        console.log('测试调用失败，但合约连接正常:', callError.message);
        message.success('合约连接成功！但函数调用需要签名者权限');
      }

    } catch (error) {
      console.error('合约连接失败:', error);
      message.error('合约连接失败: ' + error.message);
    }
  };

  // 只读测试函数
  const testReadOnlyCall = async () => {
    try {
      const address = getContractAddressLocal();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(address, contractABI.abi, provider);

      console.log('只读测试，地址:', address);

      // 尝试调用只读函数
      try {
        // 使用staticCall来测试只读函数
        const result = await contract.sayHello.staticCall();
        console.log('只读测试调用成功，返回值:', result);
        message.success(`只读测试成功！返回：${result}`);
      } catch (callError) {
        console.log('只读测试失败:', callError.message);
        message.error('只读测试失败: ' + callError.message);
      }

    } catch (error) {
      console.error('只读测试失败:', error);
      message.error('只读测试失败: ' + error.message);
    }
  };

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined style={{ color: '#52c41a' }} />
          日志方式
        </Space>
      }
      extra={
        <div style={{ fontSize: '12px', color: '#666' }}>
          <DatabaseOutlined /> 合约地址: {getContractAddressLocal()}
        </div>
      }
    >
      <Alert
        message="智能合约交互"
        description="通过调用智能合约函数来写入日志数据到区块链上。当前支持sayHello()和sayHelloTo(name)两个函数。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleWriteLog}
        initialValues={{
          logType: 'hello',
          logContent: ''
        }}
      >
        <Form.Item
          label="日志类型"
          name="logType"
          rules={[{ required: true, message: '请选择日志类型' }]}
        >
          <Button.Group style={{ width: '100%' }}>
            <Button
              value="hello"
              style={{ width: '50%' }}
              onClick={() => form.setFieldsValue({ logType: 'hello' })}
            >
              sayHello()
            </Button>
            <Button
              value="helloTo"
              style={{ width: '50%' }}
              onClick={() => form.setFieldsValue({ logType: 'helloTo' })}
            >
              sayHelloTo(name)
            </Button>
          </Button.Group>
        </Form.Item>

        {form.getFieldValue('logType') === 'helloTo' && (
          <Form.Item
            label="问候名字"
            name="logContent"
            rules={[
              { required: true, message: '请输入要问候的名字' },
              { min: 1, max: 20, message: '名字长度在1-20个字符之间' }
            ]}
          >
            <Input
              placeholder="请输入要问候的名字，例如：张三"
              prefix={<DatabaseOutlined />}
              maxLength={20}
              showCount
            />
          </Form.Item>
        )}

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button
              onClick={testContractConnection}
              icon={<DatabaseOutlined />}
            >
              测试合约连接
            </Button>

            <Button
              onClick={() => testReadOnlyCall()}
              icon={<DatabaseOutlined />}
            >
              只读测试
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<FileTextOutlined />}
              size="large"
            >
              {loading ? '处理中...' : '写入日志'}
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Divider />

      {/* The Graph数据显示区域 */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>
            <CloudOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            The Graph数据查询
          </Title>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchSubgraphData}
            loading={loadingSubgraph}
            size="small"
          >
            刷新数据
          </Button>
        </div>

        <Alert
          message="实时数据查询"
          description="通过The Graph查询智能合约的helloTos事件数据，实时显示最新的合约调用记录。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {loadingSubgraph ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#666' }}>正在从The Graph获取数据...</div>
          </div>
        ) : subgraphData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <CloudOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <div>暂无helloTos数据</div>
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              可能原因：合约尚未被调用，或The Graph索引延迟
            </div>
          </div>
        ) : (
          <List
            dataSource={subgraphData}
            renderItem={(item, index) => (
              <List.Item
                style={{
                  padding: '16px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  background: '#fafafa'
                }}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Text strong style={{ color: '#1890ff' }}>
                      #{index + 1} - {item.name || '未知'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(Number(item.blockTimestamp) * 1000).toLocaleString()}
                    </Text>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '12px' }}>
                    <div>
                      <Text type="secondary">记录ID:</Text>
                      <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {item.id}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">问候名字:</Text>
                      <div style={{ fontWeight: 500 }}>
                        {item.name || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">区块号:</Text>
                      <div style={{ fontFamily: 'monospace' }}>
                        #{item.blockNumber}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">交易哈希:</Text>
                      <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {item.transactionHash}
                      </div>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>

      <Divider />

      <div style={{ fontSize: '12px', color: '#666' }}>
        <p><strong>功能说明：</strong></p>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>调用合约写日志：通过智能合约函数写入数据</li>
          <li>sayHello()：返回固定的问候语</li>
          <li>sayHelloTo(name)：返回个性化的问候语</li>
        </ul>

        <p><strong>合约信息：</strong></p>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>合约地址：{getContractAddressLocal()}</li>
          <li>网络：{network === 'test' ? '测试网' : network === 'local' ? '本地' : '主网'}</li>
          <li>ABI：已加载智能合约接口</li>
        </ul>

        <p><strong>注意事项：</strong></p>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>确保钱包已连接到正确的网络</li>
          <li>调用合约需要支付gas费</li>
          <li>所有操作都会记录在区块链上</li>
          <li>建议先测试合约连接再执行操作</li>
        </ul>
      </div>
    </Card>
  );
};

export default LogMethod;
