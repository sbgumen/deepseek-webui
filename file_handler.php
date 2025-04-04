<?php
/**
 * DeepSeek Web 文件处理模块
 * 负责安全地处理上传和访问文件
 */

// 防止直接访问
if (!defined('DEEPSEEK_ACCESS')) {
    die('Direct access not permitted');
}

/**
 * 处理文件上传
 */
function handleFileUpload() {
    global $config;
    
    $uploadDir = $config['upload']['directory'] . '/';
    
    // 确保上传目录存在
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $files = $_FILES['files'];
    $fileCount = count($files['name']);
    $uploadedFiles = [];
    
    for ($i = 0; $i < $fileCount; $i++) {
        $fileName = $files['name'][$i];
        $fileTmpPath = $files['tmp_name'][$i];
        $fileSize = $files['size'][$i];
        $fileError = $files['error'][$i];
        $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        
        // 检查上传错误
        if ($fileError !== UPLOAD_ERR_OK) {
            continue;
        }
        
        // 检查文件大小
        if ($fileSize > $config['upload']['max_file_size']) {
            continue;
        }
        
        // 检查文件类型
        if (!in_array($fileExt, $config['upload']['allowed_types'])) {
            continue;
        }
        
        // 生成安全的文件名
        $newFileName = 'uploaded_' . uniqid() . '_' . sanitizeFileName($fileName);
        $uploadFilePath = $uploadDir . $newFileName;
        
        // 移动上传的文件
        if (move_uploaded_file($fileTmpPath, $uploadFilePath)) {
            $uploadedFiles[] = [
                'original_name' => $fileName,
                'stored_name' => $newFileName,
                'size' => $fileSize,
                'path' => $uploadFilePath,
                'url' => './uploads/' . $newFileName,
                'type' => $fileExt
            ];
        }
    }
    
    // 返回上传结果
    echo json_encode([
        'success' => count($uploadedFiles) > 0,
        'files' => $uploadedFiles
    ]);
}

/**
 * 安全地提供文件访问
 */
function serveFile($fileParam) {
    global $config;
    
    $fileName = isset($_GET['file']) ? $_GET['file'] : '';
    
    if (empty($fileName) || !preg_match('/^uploaded_[a-zA-Z0-9]+_/', $fileName)) {
        header('HTTP/1.0 404 Not Found');
        echo 'File not found';
        exit;
    }
    
    $filePath = $config['upload']['directory'] . '/' . $fileName;
    
    if (!file_exists($filePath)) {
        header('HTTP/1.0 404 Not Found');
        echo 'File not found';
        exit;
    }
    
    // 获取文件信息
    $fileInfo = pathinfo($filePath);
    $fileExt = strtolower($fileInfo['extension']);
    
    // 设置内容类型
    $contentType = getContentTypeByExtension($fileExt);
    header('Content-Type: ' . $contentType);
    
    // 设置内容长度
    $fileSize = filesize($filePath);
    header('Content-Length: ' . $fileSize);
    
    // 设置下载头
    $originalName = preg_replace('/^uploaded_[a-zA-Z0-9]+_/', '', $fileName);
    header('Content-Disposition: inline; filename="' . $originalName . '"');
    
    // 输出文件
    readfile($filePath);
    exit;
}

/**
 * 根据扩展名获取MIME类型
 */
function getContentTypeByExtension($ext) {
    $mimeTypes = [
        // 文本文件
        'txt' => 'text/plain',
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'xml' => 'application/xml',
        'md' => 'text/markdown',
        
        // 图片
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'webp' => 'image/webp',
        'ico' => 'image/x-icon',
        
        // 文档
        'pdf' => 'application/pdf',
        'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls' => 'application/vnd.ms-excel',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt' => 'application/vnd.ms-powerpoint',
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        
        // 归档文件
        'zip' => 'application/zip',
        'rar' => 'application/x-rar-compressed',
        '7z' => 'application/x-7z-compressed',
        'tar' => 'application/x-tar',
        'gz' => 'application/gzip',
        
        // 音频/视频
        'mp3' => 'audio/mpeg',
        'mp4' => 'video/mp4',
        'webm' => 'video/webm',
        'ogg' => 'audio/ogg',
        'wav' => 'audio/wav',
        
        // 字体
        'ttf' => 'font/ttf',
        'otf' => 'font/otf',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        
        // CSV
        'csv' => 'text/csv',
    ];
    
    return isset($mimeTypes[$ext]) ? $mimeTypes[$ext] : 'application/octet-stream';
}

/**
 * 清理文件名
 */
function sanitizeFileName($fileName) {
    // 移除危险字符
    $fileName = preg_replace('/[^\w\.\-]/i', '_', $fileName);
    
    // 确保文件名唯一
    return $fileName;
}