<?php
/**
 * DeepSeek API配置文件
 * 包含API密钥和端点URL等敏感信息
 */


// 防止直接访问
if (!defined('DEEPSEEK_ACCESS')) {
    die('Direct access not permitted');
}

return [
    // API配置
    'api' => [
        'key' => apikey', // 替换为实际的DeepSeek API密钥
        'url' => 'https://api.deepseek.com/v1/chat/completions', // DeepSeek API端点
        'models' => [
            'default' => 'deepseek-chat', // 默认模型
            'thinking' => 'deepseek-reasoner' // 深度思考模型
        ],
        'parameters' => [
            'temperature' => 0.1,  // 默认温度
            'max_tokens' => 20000,  // 默认最大token数
            'top_p' => 0.9,        // 默认top_p值
        ]
    ],
    
    // 文件上传配置
    'upload' => [
        'max_file_size' => 100 * 1024 * 1024, // 100MB
        'allowed_types' => [
            // 文档
            'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'md',
            // 表格
            'xls', 'xlsx', 'csv',
            // 演示文稿
            'ppt', 'pptx',
            // 图片
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
            // 代码文件
            'json', 'xml', 'html', 'css', 'js', 'php', 'py', 'java', 'c', 'cpp', 'h'
        ],
        'directory' => __DIR__ . '/uploads',
    ],
    
    // 对话记录配置
    'conversation' => [
        'directory' => __DIR__ . '/conversations',
        'max_history' => 100 // 每个用户存储的最大对话数
    ],
    
    // 用户配置
    'users' => [
        'use_authentication' => false, // 是否启用用户认证
        'default_user' => 'anonymous', // 默认用户ID
    ],
    
    // 系统配置
    'system' => [
        'debug' => false, // 调试模式
        'timezone' => 'Asia/Shanghai', // 时区设置
        'version' => '1.0.0', // 应用版本
    ]
];
?>
