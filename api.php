<?php
/**
 * DeepSeek Web接口 API处理程序
 * 负责处理前端请求、与DeepSeek API通信、对话记录管理
 */

// 防止直接脚本执行
define('DEEPSEEK_ACCESS', true);

// 设置错误报告
ini_set('display_errors', 0);
error_reporting(E_ALL);

// 允许跨域请求
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 如果是预检请求，直接返回成功
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 加载配置
$config = require_once __DIR__ . '/config.php';

// 加载文件处理模块
require_once __DIR__ . '/file_handler.php';

// 设置时区
date_default_timezone_set($config['system']['timezone']);

// 创建必要的目录
ensureDirectoriesExist([
    $config['upload']['directory'],
    $config['conversation']['directory']
]);

// 获取当前用户ID（在实际应用中这里应该有认证逻辑）
$userId = $config['users']['default_user'];

// 根据请求类型分发处理
$requestType = isset($_GET['action']) ? $_GET['action'] : '';

// 处理文件上传请求
if (isset($_FILES['files'])) {
    handleFileUpload();
    exit;
}

// 处理文件服务请求
if ($requestType === 'serve_file') {
    serveFile($_GET['file'] ?? '');
    exit;
}

// 处理JSON POST请求
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// 如果有JSON数据，处理API请求
if ($data && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // 根据action参数处理不同类型的请求
    switch ($requestType) {
        case 'get_conversations':
            getConversations();
            break;
        case 'get_conversation':
            getConversation(isset($data['conversation_id']) ? $data['conversation_id'] : '');
            break;
        case 'delete_conversation':
            deleteConversation(isset($data['conversation_id']) ? $data['conversation_id'] : '');
            break;
        default:
            // 默认处理对话请求
            handleChatRequest($data);
            break;
    }
} else {
    // 处理GET请求
    switch ($requestType) {
        case 'get_conversations':
            getConversations();
            break;
        case 'get_conversation':
            getConversation(isset($_GET['conversation_id']) ? $_GET['conversation_id'] : '');
            break;
        default:
            returnError(400, 'Invalid request');
            break;
    }
}

/**
 * 处理与DeepSeek API的聊天请求
 */
function handleChatRequest($data) {
    global $config, $userId;
    
    // 验证请求数据
    if (!isset($data['messages']) || !is_array($data['messages'])) {
        returnError(400, 'Missing or invalid messages');
        return;
    }
    
    // 提取请求参数
    $messages = $data['messages'];
    $conversationId = isset($data['conversation_id']) ? $data['conversation_id'] : generateConversationId();
    $model = isset($data['model']) ? $data['model'] : $config['api']['models']['default'];
    
    // 如果指定使用深度思考，切换到思考模型
    if (isset($data['deep_thinking']) && $data['deep_thinking']) {
        $model = $config['api']['models']['thinking'];
    }
    
    // 合并API参数（使用配置默认值，允许请求覆盖部分参数）
    $temperature = isset($data['temperature']) ? $data['temperature'] : $config['api']['parameters']['temperature'];
    $maxTokens = isset($data['max_tokens']) ? $data['max_tokens'] : $config['api']['parameters']['max_tokens'];
    $topP = isset($data['top_p']) ? $data['top_p'] : $config['api']['parameters']['top_p'];
    $stream = isset($data['stream']) ? $data['stream'] : true;
    $tools = isset($data['tools']) ? $data['tools'] : null;
    
    // 处理文件信息
    $fileInfo = [];
    if (isset($data['files']) && is_array($data['files'])) {
        $fileInfo = $data['files'];
        
        // 将文件信息添加到消息中
        $fileMessage = "我上传了以下文件：\n";
        foreach ($fileInfo as $file) {
            $fileMessage .= "- {$file['name']} ({$file['type']})\n";
        }
        
        // 确保消息数组中包含文件信息
        $foundUserMessage = false;
        foreach ($messages as $index => $message) {
            if ($message['role'] === 'user') {
                // 检查最后一条用户消息是否已包含文件信息
                if (!$foundUserMessage) {
                    $foundUserMessage = true;
                }
            }
        }
        
        // 如果没有找到用户消息或最后一条消息不包含文件信息，添加文件信息
        if (!$foundUserMessage) {
            $messages[] = [
                'role' => 'user',
                'content' => $fileMessage
            ];
        }
    }
    
    // 准备发送到DeepSeek的数据
    $requestData = [
        'model' => $model,
        'messages' => $messages,
        'temperature' => $temperature,
        'max_tokens' => $maxTokens,
        'top_p' => $topP,
        'stream' => $stream
    ];
    
    // 如果有工具配置，添加到请求中
    if ($tools !== null) {
        $requestData['tools'] = $tools;
    }
    
    // 保存请求消息到对话历史
    saveConversationMessage($userId, $conversationId, $messages, array_merge([
        'model' => $model,
        'deep_thinking' => isset($data['deep_thinking']) ? $data['deep_thinking'] : false,
        'files' => $fileInfo
    ], $requestData));
    
    // 设置curl选项
    $ch = curl_init($config['api']['url']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $config['api']['key']
    ]);
    
    // 如果是流式响应
    // 替换handleChatRequest函数中的流式输出部分
if ($stream) {
    // 设置合适的头部
    header('Content-Type: text/event-stream');
    header('Cache-Control: no-cache');
    header('Connection: keep-alive');
    
    // 禁用输出缓冲
    if (ob_get_level()) ob_end_clean();
    
    // 关闭输出压缩
    ini_set('zlib.output_compression', 0);
    ini_set('output_buffering', 0);
    
    // 发送初始空白数据以启动连接
    echo "retry: 1000\n\n";
    flush();
    
    // 记录响应内容
    $responseContent = '';
    
    // 设置curl选项，确保更小的数据块和更频繁的输出
    curl_setopt($ch, CURLOPT_BUFFERSIZE, 128); // 减小缓冲区大小
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($curl, $data) use (&$responseContent) {
        $responseContent .= $data;
        
        // 拆分数据，确保更细粒度的输出
        $chunks = str_split($data, 1); // 每个字符单独发送
        foreach($chunks as $chunk) {
            echo $chunk;
            flush();
        }
        
        return strlen($data);
    });
    
    // 执行请求
    curl_exec($ch);
    
    // 检查错误
    if (curl_errno($ch)) {
        http_response_code(500);
        echo "data: " . json_encode(['error' => curl_error($ch)]) . "\n\n";
    } else {
        // 解析流式响应，提取完整消息内容
        $assistantMessage = extractAssistantMessage($responseContent);
        if ($assistantMessage) {
            // 保存AI响应到对话历史
            $assistantData = [
                'role' => 'assistant',
                'content' => $assistantMessage
            ];
            appendConversationMessage($userId, $conversationId, $assistantData);
        }
        
        // 确保结束标记被发送
        echo "data: [DONE]\n\n";
        flush();
    }
}
    
    // 关闭curl
    curl_close($ch);
}

/**
 * 获取用户的所有对话
 */
function getConversations() {
    global $config, $userId;
    
    $conversationsDir = $config['conversation']['directory'] . '/' . $userId;
    $conversations = [];
    
    if (is_dir($conversationsDir)) {
        $files = glob($conversationsDir . '/*.json');
        
        foreach ($files as $file) {
            $conversationId = basename($file, '.json');
            $data = json_decode(file_get_contents($file), true);
            
            if ($data) {
                // 提取对话标题和时间
                $title = isset($data['title']) ? $data['title'] : '新对话';
                $created = isset($data['created_at']) ? $data['created_at'] : filemtime($file);
                $updated = isset($data['updated_at']) ? $data['updated_at'] : filemtime($file);
                
                // 如果没有标题，尝试从第一条消息生成
                if ($title === '新对话' && isset($data['messages'][0]['content'])) {
                    // 使用用户的第一条消息作为标题
                    foreach ($data['messages'] as $message) {
                        if ($message['role'] === 'user') {
                            $title = mb_substr($message['content'], 0, 30) . (mb_strlen($message['content']) > 30 ? '...' : '');
                            break;
                        }
                    }
                }
                
                $conversations[] = [
                    'id' => $conversationId,
                    'title' => $title,
                    'created_at' => $created,
                    'updated_at' => $updated,
                    'message_count' => count($data['messages'])
                ];
            }
        }
    }
    
    // 按更新时间排序
    usort($conversations, function($a, $b) {
        return $b['updated_at'] - $a['updated_at'];
    });
    
    // 返回对话列表
    echo json_encode([
        'success' => true,
        'conversations' => $conversations
    ]);
}

/**
 * 获取特定对话的详细信息
 */
function getConversation($conversationId) {
    global $config, $userId;
    
    if (empty($conversationId)) {
        returnError(400, 'Conversation ID is required');
        return;
    }
    
    $conversationFile = $config['conversation']['directory'] . '/' . $userId . '/' . $conversationId . '.json';
    
    if (!file_exists($conversationFile)) {
        returnError(404, 'Conversation not found');
        return;
    }
    
    $data = json_decode(file_get_contents($conversationFile), true);
    
    if (!$data) {
        returnError(500, 'Failed to load conversation data');
        return;
    }
    
    // 返回对话数据
    echo json_encode([
        'success' => true,
        'conversation' => $data
    ]);
}

/**
 * 删除特定对话
 */
function deleteConversation($conversationId) {
    global $config, $userId;
    
    if (empty($conversationId)) {
        returnError(400, 'Conversation ID is required');
        return;
    }
    
    $conversationFile = $config['conversation']['directory'] . '/' . $userId . '/' . $conversationId . '.json';
    
    if (!file_exists($conversationFile)) {
        returnError(404, 'Conversation not found');
        return;
    }
    
    if (unlink($conversationFile)) {
        echo json_encode([
            'success' => true,
            'message' => 'Conversation deleted successfully'
        ]);
    } else {
        returnError(500, 'Failed to delete conversation');
    }
}

/**
 * 保存对话消息
 */
function saveConversationMessage($userId, $conversationId, $messages, $metadata = []) {
    global $config;
    
    $userDir = $config['conversation']['directory'] . '/' . $userId;
    
    // 确保用户目录存在
    if (!is_dir($userDir)) {
        mkdir($userDir, 0755, true);
    }
    
    $conversationFile = $userDir . '/' . $conversationId . '.json';
    $now = time();
    
    // 创建或更新对话文件
    if (file_exists($conversationFile)) {
        $data = json_decode(file_get_contents($conversationFile), true);
        if (!$data) {
            $data = [
                'id' => $conversationId,
                'title' => '新对话',
                'created_at' => $now,
                'updated_at' => $now,
                'messages' => [],
                'metadata' => []
            ];
        }
    } else {
        $data = [
            'id' => $conversationId,
            'title' => '新对话',
            'created_at' => $now,
            'updated_at' => $now,
            'messages' => [],
            'metadata' => []
        ];
    }
    
    // 更新元数据
    $data['metadata'] = array_merge($data['metadata'], $metadata);
    $data['updated_at'] = $now;
    
    // 如果是新对话，提取第一条用户消息作为标题
    if ($data['title'] === '新对话' && !empty($messages)) {
        // 查找第一条用户消息
        foreach ($messages as $message) {
            if ($message['role'] === 'user') {
                $data['title'] = mb_substr($message['content'], 0, 30) . (mb_strlen($message['content']) > 30 ? '...' : '');
                break;
            }
        }
    }
    
    // 保存所有新消息
    foreach ($messages as $message) {
        if (!isset($message['timestamp'])) {
            $message['timestamp'] = $now;
        }
        $data['messages'][] = $message;
    }
    
    // 写入文件
    file_put_contents($conversationFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    return $conversationId;
}

/**
 * 向现有对话添加单条消息
 */
function appendConversationMessage($userId, $conversationId, $message) {
    global $config;
    
    $userDir = $config['conversation']['directory'] . '/' . $userId;
    $conversationFile = $userDir . '/' . $conversationId . '.json';
    
    if (file_exists($conversationFile)) {
        $data = json_decode(file_get_contents($conversationFile), true);
        if ($data) {
            if (!isset($message['timestamp'])) {
                $message['timestamp'] = time();
            }
            $data['messages'][] = $message;
            $data['updated_at'] = time();
            
            file_put_contents($conversationFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            return true;
        }
    }
    
    return false;
}

/**
 * 从SSE流响应中提取完整的助手消息
 */
function extractAssistantMessage($responseContent) {
    $content = '';
    $lines = explode("\n", $responseContent);
    
    foreach ($lines as $line) {
        if (strpos($line, 'data: ') === 0) {
            $data = substr($line, 6);
            if ($data === '[DONE]') continue;
            
            try {
                $json = json_decode($data, true);
                if (isset($json['choices'][0]['delta']['content'])) {
                    $content .= $json['choices'][0]['delta']['content'];
                }
            } catch (Exception $e) {
                // 解析错误，跳过
            }
        }
    }
    
    return $content;
}

/**
 * 生成唯一的对话ID
 */
function generateConversationId() {
    return uniqid() . '-' . substr(md5(uniqid(mt_rand(), true)), 0, 8);
}

/**
 * 确保所需目录存在
 */
function ensureDirectoriesExist($directories) {
    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

/**
 * 返回错误信息
 */
function returnError($code, $message) {
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}