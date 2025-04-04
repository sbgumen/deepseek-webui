# DeepSeek 前端ui
一个高度还原的DeepSeek前端界面克隆项目，通过自建API代理实现DeepSeek模型的调用。


[演示地址](http://deepseek.lzx1.top)

## 项目简介

本项目旨在复刻DeepSeek的前端交互界面，通过PHP后端代理层实现与DeepSeek大语言模型的无缝通信。这为开发者和用户提供了一个熟悉的DeepSeek界面体验，同时让您可以使用自己的API密钥访问DeepSeek模型。

## 技术架构

- **前端**: 纯HTML、CSS、JavaScript实现的用户界面
- **后端**: PHP实现的API代理层，负责处理与DeepSeek API的通信
- **配置**: 简单的PHP配置文件，无需复杂的环境设置

## 核心功能

- 高度还原的DeepSeek用户界面
- 完整的聊天对话功能
- 支持Markdown、代码高亮及语法渲染
- 对话历史管理
- 多会话并行支持
- 文件上传功能
- 响应式设计，支持移动端和桌面端

## 安装指南

### 前置条件

- PHP 7.4+ 
- Web服务器 (Apache/Nginx)
- DeepSeek API密钥

### 安装步骤

1. 克隆或下载代码库到您的Web服务器目录

```bash
git clone https://github.com/yourusername/deepseek-frontend-clone.git
# 或直接下载ZIP文件并解压到网站根目录
```

2. 配置Web服务器

确保您的Web服务器指向项目的根目录，并且PHP已正确配置。

对于Apache，可以使用以下.htaccess配置:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.php$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.php [L]
</IfModule>
```

3. 配置API密钥

编辑`config.php`文件，更新以下配置：

```php
// API配置
'api' => [
    'key' => 'YOUR_DEEPSEEK_API_KEY_HERE', // 替换为您的API密钥
    'url' => 'https://api.deepseek.top/v1/chat/completions', // DeepSeek API地址
    'models' => [
        'default' => 'deepseek-v3', // 默认模型
        'thinking' => 'deepseek-r1' // 深度思考模型
    ],
    // 其他参数...
],
```
[获取官网apikey](https://platform.deepseek.com/)

[更便宜高效的中转api站](https://api.lzx1.top)

4. 目录权限

确保上传目录和对话历史目录具有正确的写入权限：

```bash
chmod 755 uploads
chmod 755 conversations
```

5. 访问您的网站

通过浏览器访问项目部署的URL，即可使用DeepSeek克隆前端。

## 配置说明

项目的所有配置都集中在`config.php`文件中，主要包括以下几个部分：

### API配置

```php
'api' => [
    'key' => 'YOUR_API_KEY', // DeepSeek API密钥
    'url' => 'https://api.deepseek.top/v1/chat/completions', // API地址
    'models' => [
        'default' => 'deepseek-v3', // 默认模型
        'thinking' => 'deepseek-r1' // 深度思考模型
    ],
    'parameters' => [
        'temperature' => 0.7,  // 默认温度
        'max_tokens' => 2000,  // 默认最大token数
        'top_p' => 0.9,        // 默认top_p值
    ]
],
```

### 文件上传配置

```php
'upload' => [
    'max_file_size' => 100 * 1024 * 1024, // 最大文件大小 (100MB)
    'allowed_types' => [
        // 允许的文件类型...
    ],
    'directory' => __DIR__ . '/uploads', // 上传目录
],
```

### 对话记录配置

```php
'conversation' => [
    'directory' => __DIR__ . '/conversations', // 对话历史存储目录
    'max_history' => 100 // 每个用户存储的最大对话数
],
```

### 系统配置

```php
'system' => [
    'debug' => false, // 调试模式
    'timezone' => 'Asia/Shanghai', // 时区设置
    'version' => '1.0.0', // 应用版本
],
```

## 自定义模型

您可以在配置文件中自定义可用的DeepSeek模型：

```php
'models' => [
    'default' => 'deepseek-v3', // 默认的对话模型
    'thinking' => 'deepseek-r1', // 深度思考模型
    'custom' => 'your-custom-model-id' // 添加自定义模型
],
```

## 项目结构

```
deepseek-frontend-clone/
├── assets/            # 静态资源 (CSS, JS, 图片)
│   ├── css/           # 样式文件
│   ├── js/            # JavaScript文件
│   └── images/        # 图片资源
├── includes/          # PHP包含文件
│   ├── api.php        # API处理逻辑
│   └── functions.php  # 辅助函数
├── uploads/           # 文件上传目录
├── conversations/     # 对话历史存储目录
├── config.php         # 配置文件
├── index.php          # 主入口文件
└── README.md          # 项目文档
```

## 常见问题

### API密钥无效

确保您在`config.php`中配置了正确的DeepSeek API密钥，并且该密钥具有足够的权限和余额。

### 上传文件失败

检查`uploads`目录的写入权限，并确保PHP配置允许文件上传且最大文件大小限制适当。

### 如何更换API提供商

如果您想使用其他AI服务提供商的API，只需修改`config.php`中的API URL和相应参数格式。可能需要在`includes/api.php`中调整请求处理逻辑。

## 贡献指南

欢迎对本项目提出改进建议和贡献代码:

1. Fork本项目
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 详情请参阅 [LICENSE](LICENSE) 文件

## 免责声明

本项目仅用于学习和研究目的，不隶属于DeepSeek官方。使用本项目时请遵守相关API服务的使用条款和条件。使用者需确保拥有合法的API访问权限。

## 鸣谢

- [DeepSeek](https://deepseek.com/) - 原始界面设计灵感
- 所有贡献者和用户

---

**注意**: 在部署和使用过程中，请确保您的API密钥安全，不要将包含真实API密钥的配置文件提交到公共代码库中。
