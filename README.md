# 数据上链系统 (Data On-chain System)

这是一个基于以太坊区块链的数据上链系统前端应用，使用React + Ant Design + Ether.js构建。

## 🚀 快速部署

如果你遇到部署问题，特别是 CSS MIME 类型错误，请运行：
```bash
./fix-mime.sh
```

然后重新部署项目。

## 功能特性

### 1. 转账方式 (Transfer Method)
- 支持以太币转账
- 可添加数据留言
- 实时显示钱包余额
- 简洁的转账表单和状态管理

### 2. 日志方式 (Log Method)
- 调用智能合约写入日志数据
- 支持sayHello()和sayHelloTo(name)函数
- 合约连接测试功能
- 简洁的合约交互界面

### 3. 发送USDT方式 (Send USDT Method)
- 支持USDT代币转账
- 自动兑换ETH为USDT
- 包含数据附言功能

### 4. 界面设计
- 使用Tab标签页设计，功能模块独立显示
- **转账方式tab**：简洁的转账功能
- **日志方式tab**：核心的合约交互功能
- **抢红包tab**：智能合约红包系统
- 响应式设计，支持移动端和桌面端

## 技术架构

- **前端框架**: React 18 + Hooks
- **UI组件库**: Ant Design 5.x
- **区块链交互**: Ether.js v6
- **智能合约**: Solidity (Test.sol)
- **数据查询**: GraphQL + The Graph
- **网络支持**: 测试网、本地网络、主网
- **构建工具**: Create React App
- **包管理**: pnpm

## 项目结构

```
4-2-ether-front/
├── README.md                    # 项目说明文档
├── package.json                 # 项目依赖配置
├── public/                      # 静态资源
│   ├── index.html              # HTML模板
│   └── manifest.json           # Web应用配置
├── src/                        # 源代码
│   ├── components/             # React组件
│   │   ├── TransferMethod.js   # 转账方式组件
│   │   ├── LogMethod.js        # 日志方式组件
│   │   └── USDTMethod.js       # USDT发送组件
│   ├── utils/                  # 工具函数
│   │   └── ethereum.js         # 以太坊相关工具
│   ├── App.js                  # 主应用组件
│   ├── App.css                 # 应用样式
│   ├── index.js                # 应用入口
│   └── index.css               # 全局样式
└── Test.json                   # 智能合约ABI
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

应用将在 http://localhost:3000 启动

**注意**: 如果遇到ESLint错误，可以通过以下方式禁用：
- 使用启动脚本: `./start.sh` (Linux/Mac) 或 `start.bat` (Windows)
- 设置环境变量: `ESLINT_NO_DEV_ERRORS=true npm run dev`

### 3. 构建生产版本
```bash
npm run build
```

### 4. 部署到 Cloudflare Pages
```bash
# 使用部署脚本（推荐）
./deploy.sh

# 或手动部署
npm install -g wrangler
wrangler login
wrangler pages publish build --project-name=4-2-ethers-front
```

### 5. 运行测试
```bash
npm test
```

## 使用方法

### 1. 连接钱包
- 点击右上角"连接钱包"按钮
- 选择网络（测试网/本地/主网）
- 授权连接MetaMask或其他钱包

### 2. 使用功能

#### 转账方式
1. 在文本框中输入转账说明
2. 输入转账金额
3. 输入收款账户地址
4. 添加数据留言
5. 点击转账按钮

#### 日志方式
1. 选择日志类型（sayHello或sayHelloTo）
2. 如果选择sayHelloTo，输入问候名字
3. 点击"写入日志"按钮
4. 确认交易

#### 发送USDT
1. 输入收款方地址
2. 输入USDT金额
3. 设置兑换ETH数量
4. 添加数据附言
5. 点击发送按钮

## 智能合约接口

### 合约地址
- 测试网: `0x498C9cE7Aa0aEEaea38FDfA2e326Fef215d5E962`

### 主要函数
- `sayHello()`: 返回问候语
- `sayHelloTo(string name)`: 个性化问候

## 网络配置

- **测试网**: Goerli (Chain ID: 5)
- **本地网络**: Localhost (Chain ID: 1337)
- **主网**: Ethereum Mainnet (Chain ID: 1)

## 主要依赖

```json
{
  "react": "^18.2.0",
  "antd": "^5.12.8",
  "ethers": "^6.8.1",
  "@ant-design/icons": "^5.2.6"
}
```

## 开发说明

### 组件结构
- **App.js**: 主应用组件，管理全局状态
- **TransferMethod.js**: 转账功能组件
- **LogMethod.js**: 智能合约交互组件
- **USDTMethod.js**: USDT转账组件

### 状态管理
使用React Hooks管理组件状态：
- `useState`: 管理本地状态
- `useEffect`: 处理副作用
- 通过props传递回调函数

### 样式系统
- 使用Ant Design组件库
- 自定义CSS样式
- 响应式设计支持

### 错误处理
- 网络连接错误
- 钱包连接失败
- 交易失败
- 余额不足
- 合约调用失败

### 安全考虑
- 私钥安全
- 交易确认
- 网络验证
- 合约地址验证
- 输入验证

## 部署说明

### 1. 构建应用
```bash
npm run build
```

### 2. 部署到 Cloudflare Pages

#### 方法一：通过 Cloudflare Dashboard
1. 登录 Cloudflare Dashboard
2. 进入 Pages 页面
3. 创建新项目，连接你的 Git 仓库
4. 设置构建命令：`npm run build`
5. 设置发布目录：`build`
6. 部署项目

#### 方法二：使用 Wrangler CLI
1. 安装 Wrangler：`npm install -g wrangler`
2. 登录：`wrangler login`
3. 部署：`wrangler pages publish build --project-name=4-2-ethers-front`

#### 方法三：使用部署脚本（推荐）
- **Linux/Mac**: 运行 `./deploy.sh`
- **Windows**: 运行 `deploy.bat`

部署脚本会自动：
- 检查并安装必要的工具
- 构建项目
- 部署到 Cloudflare Pages
- 提供详细的部署状态信息

### 3. 解决 MIME 类型错误
如果遇到 CSS 文件 MIME 类型错误，项目已包含以下配置文件：
- `_headers`: 设置正确的 Content-Type
- `_redirects`: 处理单页应用路由
- `wrangler.toml`: Cloudflare Pages 配置

### 4. 环境变量配置
在 Cloudflare Pages 设置中添加环境变量：
```
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_NETWORK_ID=5
```

### 5. 自定义域名
在 Cloudflare Pages 设置中可以绑定自定义域名

## 常见问题

### Q: 钱包连接失败怎么办？
A: 确保已安装MetaMask，并允许网站连接钱包

### Q: 交易失败怎么办？
A: 检查网络连接、余额是否充足、gas费设置

### Q: 如何切换到其他网络？
A: 在钱包中选择网络，或使用网络切换功能

### Q: 合约调用失败？
A: 检查合约地址是否正确，网络是否匹配

### Q: 显示"网络: unknown 1337n"怎么办？
A: 这是因为钱包连接到了本地网络。解决方法：
1. 点击右上角账户菜单中的"切换到Sepolia测试网"按钮
2. 或者在MetaMask中手动切换到Sepolia测试网
3. 确保合约地址与网络匹配

### Q: 如何获取Sepolia测试网ETH？
A: 可以通过以下方式获取：
1. Sepolia水龙头：https://sepoliafaucet.com/
2. Infura水龙头：https://www.infura.io/faucet/sepolia
3. Alchemy水龙头：https://sepoliafaucet.com/

### Q: 为什么我的数据上链记录是空的？
A: 这是一个常见问题，可能的原因和解决方案如下：

#### 可能的原因：
1. **网络不匹配**: 当前连接的网络与交易发生的网络不一致
2. **时间窗口限制**: 默认只查看最近5个区块，如果交易发生在更早的区块中
3. **地址不匹配**: 查询的地址与交易中的地址不一致
4. **网络延迟**: 区块链数据同步延迟

#### 解决方案：
1. **检查网络状态**: 
   - 确保连接到Sepolia测试网 (Chain ID: 11155111)
   - 使用右上角"检查当前网络状态"按钮验证

2. **获取更多记录**:
   - 点击"获取Sepolia交易记录"按钮获取最近20个区块的交易
   - 点击"获取历史记录"按钮从区块浏览器获取历史交易

3. **网络切换**:
   - 使用右上角"切换到Sepolia测试网"按钮
   - 在MetaMask中手动切换到Sepolia测试网

4. **调试步骤**:
   - 查看"网络状态信息"区域的详细信息
   - 检查控制台日志获取详细错误信息
   - 确认钱包地址和网络配置正确

#### 技术细节：
- 应用通过区块链节点获取交易记录
- 支持获取最近20-100个区块的交易数据
- 记录保持自然的区块顺序
- 支持实时更新和手动刷新

### Q: 如何查看详细的交易信息？
A: 每条交易记录都会显示：
- 交易哈希
- 区块号
- 时间戳
- 发送方和接收方地址
- 交易金额
- Gas使用情况
- Nonce值

### Q: 部署时遇到 CSS MIME 类型错误怎么办？
A: 这是一个常见的 Cloudflare Pages 部署问题，解决方案如下：

#### 错误信息：
```
Refused to apply style from '.../styles.css' because its MIME type ('text/html') is not a supported stylesheet MIME type
```

#### 解决方法：
1. **使用修复脚本（推荐）**：运行 `./fix-mime.sh` 自动修复配置
2. **确保配置文件存在**：项目已包含 `_headers`、`_redirects` 和 `wrangler.toml` 文件
3. **重新部署**：在 Cloudflare Pages 中重新部署项目
4. **清除缓存**：在 Cloudflare Dashboard 中清除缓存
5. **检查构建输出**：确保 `build` 文件夹包含正确的 CSS 文件

#### 技术原因：
- Cloudflare Pages 有时会错误地将 CSS 文件识别为 HTML 文件
- 配置文件确保正确的 MIME 类型设置
- 单页应用路由需要正确的重定向配置

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交Issue或联系开发团队。
