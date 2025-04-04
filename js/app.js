// DeepSeek Web应用主JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const mobileSidebarBtn = document.getElementById('mobile-menu-btn');
    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const deepThinkingBtn = document.getElementById('deep-thinking-btn');
    const webSearchBtn = document.getElementById('web-search-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const authorInfoBtn = document.getElementById('author-info-btn');
    const hiddenFileInput = document.getElementById('hidden-file-input');
    const chatHistory = document.getElementById('chat-history');
    const welcomeContainer = document.getElementById('welcome-container');
    
    // 模态框
    const settingsModal = document.getElementById('settings-modal');
    const authorModal = document.getElementById('author-modal');
    const uploadModal = document.getElementById('upload-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const saveSettingsBtn = document.getElementById('save-settings');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadFileList = document.getElementById('upload-file-list');
    const confirmUploadBtn = document.getElementById('confirm-upload');
    
    // 设置滑块
    const temperatureSlider = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperature-value');
    const maxTokensSlider = document.getElementById('max-tokens');
    const maxTokensValue = document.getElementById('max-tokens-value');
    const topPSlider = document.getElementById('top-p');
    const topPValue = document.getElementById('top-p-value');
    
    // 应用状态
    let currentConversationId = null;
    let isThinking = false;
    let deepThinkingEnabled = false;
    let webSearchEnabled = false;
    let selectedFiles = [];
    let conversationHistory = [];
    let isStreaming = false;
    let abortController = null;
    
    // 设置默认参数（从后端配置获取）
    const defaultSettings = {
        systemPrompt: '',
        temperature: window.deepseekConfig ? window.deepseekConfig.parameters.temperature : 0.7,
        maxTokens: window.deepseekConfig ? window.deepseekConfig.parameters.max_tokens : 2000,
        topP: window.deepseekConfig ? window.deepseekConfig.parameters.top_p : 0.9
    };
    
    // 从localStorage加载用户设置
    let userSettings = JSON.parse(localStorage.getItem('deepseekUserSettings')) || defaultSettings;
    
    // 初始化设置UI
    function initSettingsUI() {
        document.getElementById('system-prompt').value = userSettings.systemPrompt;
        temperatureSlider.value = userSettings.temperature;
        temperatureValue.textContent = userSettings.temperature;
        maxTokensSlider.value = userSettings.maxTokens;
        maxTokensValue.textContent = userSettings.maxTokens;
        topPSlider.value = userSettings.topP;
        topPValue.textContent = userSettings.topP;
    }
    
    
    
    // 侧边栏切换
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        const overlay = document.querySelector('.overlay');
        
        if (sidebar.classList.contains('open')) {
            if (!overlay) {
                const newOverlay = document.createElement('div');
                newOverlay.classList.add('overlay', 'active');
                document.body.appendChild(newOverlay);
                
                newOverlay.addEventListener('click', function() {
                    sidebar.classList.remove('open');
                    newOverlay.classList.remove('active');
                    setTimeout(() => {
                        newOverlay.remove();
                    }, 300);
                });
            } else {
                overlay.classList.add('active');
            }
        } else {
            if (overlay) {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.remove();
                }, 300);
            }
        }
    }
    
    // 调整输入框高度
    function adjustTextareaHeight() {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
    }
    
    // 启用/禁用发送按钮
    function toggleSendButton() {
        sendBtn.disabled = chatInput.value.trim() === '';
    }
    
    // 滚动到底部
    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    
    function enableCopyFunctionality() {
    // 复制整个消息内容
    document.addEventListener('click', function(e) {
        const copyBtn = e.target.closest('.copy-message');
        if (!copyBtn) return;
        
        // 获取整个消息元素
        const messageEl = copyBtn.closest('.message');
        if (!messageEl) return;
        
        // 找到消息文本区域
        const textEl = messageEl.querySelector('.message-text');
        if (!textEl) return;
        
        // 获取纯文本内容（去除HTML标签）
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = textEl.innerHTML;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        // 使用现代和兼容的剪贴板API
        try {
            // 优先使用现代API
            navigator.clipboard.writeText(textContent)
                .then(() => {
                    // 显示复制成功的视觉反馈
                    const originalHTML = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i>已复制';
                    copyBtn.style.backgroundColor = '#10B981';
                    copyBtn.style.color = 'white';
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                        copyBtn.style.backgroundColor = '';
                        copyBtn.style.color = '';
                    }, 2000);
                    
                    showToast('内容已复制到剪贴板');
                })
                .catch(err => {
                    // 如果现代API失败，回退到兼容方式
                    fallbackCopy(textContent);
                });
        } catch (err) {
            // 如果API不可用，回退到兼容方式
            fallbackCopy(textContent);
        }
    });
    
    // 复制代码块内容
    document.addEventListener('click', function(e) {
        const copyBtn = e.target.closest('.copy-btn');
        if (!copyBtn) return;
        
        const codeBlock = copyBtn.closest('pre');
        if (!codeBlock) return;
        
        const codeElement = codeBlock.querySelector('code');
        if (!codeElement) return;
        
        const code = codeElement.textContent || '';
        
        try {
            navigator.clipboard.writeText(code)
                .then(() => {
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = '已复制';
                    copyBtn.style.backgroundColor = '#10B981';
                    copyBtn.style.color = 'white';
                    
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                        copyBtn.style.backgroundColor = '';
                        copyBtn.style.color = '';
                    }, 2000);
                    
                    showToast('代码已复制');
                })
                .catch(() => {
                    fallbackCopy(code);
                });
        } catch (err) {
            fallbackCopy(code);
        }
    });
    
    // 兼容模式复制函数
    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showToast('内容已复制到剪贴板');
            } else {
                showToast('复制失败，请手动复制', 'error');
            }
        } catch (err) {
            showToast('复制失败，请手动复制', 'error');
        }
        
        document.body.removeChild(textarea);
    }
}
    
    // 格式化代码块
    // 修改后的HTML转义函数 - 增强版
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 修改renderMarkdown函数中处理代码块的部分
function renderMarkdown(text) {
    if (!text) return '';
    
    // 保护HTML代码块 - 优先处理html和xml类型
    let codeBlocks = [];
    text = text.replace(/```(html|xml|[a-zA-Z]*)\n([\s\S]*?)```/g, function(match, language, code) {
        const id = codeBlocks.length;
        // 确保HTML和XML代码被特殊处理
        const isHtmlLike = /html|xml/i.test(language);
        codeBlocks.push({
            language: language.trim() || 'plaintext',
            code: code.trim(),
            isHtmlLike: isHtmlLike
        });
        return `__CODE_BLOCK_${id}__`;
    });
    
    let inlineCode = [];
    text = text.replace(/`([^`]+)`/g, function(match, code) {
        let id = inlineCode.length;
        inlineCode.push(code);
        return `__INLINE_CODE_${id}__`;
    });
    
    // Now apply Markdown transformations
    
    // 处理标题 - only match at the beginning of a line
    text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // 处理粗体和斜体
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 处理列表
    text = text.replace(/^\s*- (.*$)/gm, '<li>$1</li>');
    
    // Wrap lists, but do it more carefully
    let listStarted = false;
    let lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('<li>') && !listStarted) {
            lines[i] = '<ul>' + lines[i];
            listStarted = true;
        } else if (!lines[i].startsWith('<li>') && listStarted) {
            lines[i-1] = lines[i-1] + '</ul>';
            listStarted = false;
        }
    }
    if (listStarted) {
        lines[lines.length-1] = lines[lines.length-1] + '</ul>';
    }
    text = lines.join('\n');
    
    // 处理有序列表 - similar approach for ordered lists
    listStarted = false;
    lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (/^\s*\d+\. /.test(lines[i])) {
            lines[i] = '<li>' + lines[i].replace(/^\s*\d+\. /, '') + '</li>';
            if (!listStarted) {
                lines[i] = '<ol>' + lines[i];
                listStarted = true;
            }
        } else if (listStarted) {
            lines[i-1] = lines[i-1] + '</ol>';
            listStarted = false;
        }
    }
    if (listStarted) {
        lines[lines.length-1] = lines[lines.length-1] + '</ol>';
    }
    text = lines.join('\n');
    
    // 处理链接
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // 处理分割线
    text = text.replace(/^\s*---\s*$/gm, '<hr>');
    
    // 处理段落
    text = text.replace(/\n\s*\n/g, '</p><p>');
    text = '<p>' + text + '</p>';
    text = text.replace(/<p><\/p>/g, '');
    
    // Now restore code blocks
    text = text.replace(/__CODE_BLOCK_(\d+)__/g, function(match, id) {
        const block = codeBlocks[parseInt(id)];
        return `<pre><div class="code-header"><span>${block.language}</span><button class="copy-btn">复制</button></div><code class="language-${block.language}">${escapeHtml(block.code)}</code></pre>`;
    });
    
    // 恢复代码块，确保HTML内容被完全转义
    text = text.replace(/__CODE_BLOCK_(\d+)__/g, function(match, id) {
        const block = codeBlocks[parseInt(id)];
        // 对HTML和XML类代码进行额外转义处理
        const codeContent = block.isHtmlLike ? 
            escapeHtml(block.code) : 
            escapeHtml(block.code);
            
        return `<pre><div class="code-header"><span>${escapeHtml(block.language)}</span><button class="copy-btn">复制</button></div><code class="language-${block.language}">${codeContent}</code></pre>`;
    });
    
    return text;
}
    
    
    
    // 使用RAF回调优化滚动操作
function optimizedScrollToBottom() {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;
    
    if (!window._scrollRAF) {
        window._scrollRAF = requestAnimationFrame(() => {
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: 'smooth'
            });
            window._scrollRAF = null;
        });
    }
}

// 添加CSS以优化流式文本动画
function addStreamingStyles() {
    const styleId = 'streaming-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        @keyframes cursor-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
        
        .streaming .message-text:after {
            content: '';
            display: inline-block;
            width: 8px;
            height: 18px;
            background-color: #4D6BFE;
            vertical-align: text-bottom;
            animation: cursor-blink 0.8s infinite;
            margin-left: 2px;
        }
        
        .message-text pre {
            overflow-x: auto;
            position: relative;
        }
        
        .message-text code {
            white-space: pre !important;
        }
        
        /* 确保代码被正确显示 */
        .message-text pre code.language-html,
        .message-text pre code.language-xml {
            color: #333333;
            font-family: monospace;
        }
    `;
    
    document.head.appendChild(style);
}

    
    // 添加用户消息到聊天
    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.innerHTML = `
            <div class="message-avatar user">
                <img src="img/avatar.jpg" alt="用户头像">
            </div>
            <div class="message-content">
                <div class="message-text">${message}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
        scrollToBottom();
        
        // 添加到对话历史
        conversationHistory.push({
            role: 'user',
            content: message
        });
    }
    
    // 添加AI消息到聊天（流式输出前的占位）
    function addAIMessagePlaceholder() {
        const messageElement = document.createElement('div');
        messageElement.className = 'message ai-message';
        messageElement.id = 'current-ai-message';
        
        let thinkingHeader = '';
if (deepThinkingEnabled) {
    thinkingHeader = `
        <div class="message-thinking thinking-animation">
            <span class="loader"></span>
            <span class="thinking-text">已深度思考</span>
            <span class="thinking-timer">(用时 0 秒)</span>
        </div>
    `;
    
    // 在消息添加到DOM后启动计时器
    setTimeout(() => {
        const thinkingElement = messageElement.querySelector('.message-thinking');
        if (thinkingElement) {
            startThinkingTimer(thinkingElement);
        }
    }, 100);
} else {
    thinkingHeader = `
        <div class="message-thinking thinking-animation">
            <span class="loader"></span>
            <span class="thinking-text">思考中...</span>
        </div>
    `;
}
        
        messageElement.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M27.501 8.46875C27.249 8.3457 27.1406 8.58008 26.9932 8.69922C26.9434 8.73828 26.9004 8.78906 26.8584 8.83398C26.4902 9.22852 26.0605 9.48633 25.5 9.45508C24.6787 9.41016 23.9785 9.66797 23.3594 10.2969C23.2275 9.52148 22.79 9.05859 22.125 8.76172C21.7764 8.60742 21.4238 8.45312 21.1807 8.11719C21.0098 7.87891 20.9639 7.61328 20.8779 7.35156C20.8242 7.19336 20.7695 7.03125 20.5879 7.00391C20.3906 6.97266 20.3135 7.13867 20.2363 7.27734C19.9258 7.84375 19.8066 8.46875 19.8174 9.10156C19.8447 10.5234 20.4453 11.6562 21.6367 12.4629C21.7725 12.5547 21.8076 12.6484 21.7646 12.7832C21.6836 13.0605 21.5869 13.3301 21.501 13.6074C21.4473 13.7852 21.3662 13.8242 21.1768 13.7461C20.5225 13.4727 19.957 13.0684 19.458 12.5781C18.6104 11.7578 17.8438 10.8516 16.8877 10.1426C16.6631 9.97656 16.4395 9.82227 16.207 9.67578C15.2314 8.72656 16.335 7.94727 16.5898 7.85547C16.8574 7.75977 16.6826 7.42773 15.8193 7.43164C14.957 7.43555 14.167 7.72461 13.1611 8.10938C13.0137 8.16797 12.8594 8.21094 12.7002 8.24414C11.7871 8.07227 10.8389 8.0332 9.84766 8.14453C7.98242 8.35352 6.49219 9.23633 5.39648 10.7441C4.08105 12.5547 3.77148 14.6133 4.15039 16.7617C4.54883 19.0234 5.70215 20.8984 7.47559 22.3633C9.31348 23.8809 11.4307 24.625 13.8457 24.4824C15.3125 24.3984 16.9463 24.2012 18.7881 22.6406C19.2529 22.8711 19.7402 22.9629 20.5498 23.0332C21.1729 23.0918 21.7725 23.002 22.2373 22.9062C22.9648 22.752 22.9141 22.0781 22.6514 21.9531C20.5186 20.959 20.9863 21.3633 20.5605 21.0371C21.6445 19.752 23.2783 18.418 23.917 14.0977C23.9668 13.7539 23.9238 13.5391 23.917 13.2598C23.9131 13.0918 23.9512 13.0254 24.1445 13.0059C24.6787 12.9453 25.1973 12.7988 25.6738 12.5352C27.0557 11.7793 27.6123 10.5391 27.7441 9.05078C27.7637 8.82422 27.7402 8.58789 27.501 8.46875ZM15.46 21.8613C13.3926 20.2344 12.3906 19.6992 11.9766 19.7227C11.5898 19.7441 11.6592 20.1875 11.7441 20.4766C11.833 20.7617 11.9492 20.959 12.1123 21.209C12.2246 21.375 12.3018 21.623 12 21.8066C11.334 22.2207 10.1768 21.668 10.1221 21.6406C8.77539 20.8477 7.64941 19.7988 6.85547 18.3652C6.08984 16.9844 5.64453 15.5039 5.57129 13.9238C5.55176 13.541 5.66406 13.4062 6.04297 13.3379C6.54199 13.2461 7.05762 13.2266 7.55664 13.2988C9.66602 13.6074 11.4619 14.5527 12.9668 16.0469C13.8262 16.9004 14.4766 17.918 15.1465 18.9121C15.8584 19.9688 16.625 20.9746 17.6006 21.7988C17.9443 22.0879 18.2197 22.3086 18.4824 22.4707C17.6895 22.5586 16.3652 22.5781 15.46 21.8613ZM16.4502 15.4805C16.4502 15.3105 16.5859 15.1758 16.7568 15.1758C16.7949 15.1758 16.8301 15.1836 16.8613 15.1953C16.9033 15.2109 16.9424 15.2344 16.9727 15.2695C17.0273 15.3223 17.0586 15.4004 17.0586 15.4805C17.0586 15.6504 16.9229 15.7852 16.7529 15.7852C16.582 15.7852 16.4502 15.6504 16.4502 15.4805ZM19.5273 17.0625C19.3301 17.1426 19.1328 17.2129 18.9434 17.2207C18.6494 17.2344 18.3281 17.1152 18.1533 16.9688C17.8828 16.7422 17.6895 16.6152 17.6074 16.2168C17.5732 16.0469 17.5928 15.7852 17.623 15.6348C17.6934 15.3105 17.6152 15.1035 17.3877 14.9141C17.2012 14.7598 16.9658 14.7188 16.7061 14.7188C16.6094 14.7188 16.5205 14.6758 16.4541 14.6406C16.3457 14.5859 16.2568 14.4512 16.3418 14.2852C16.3691 14.2324 16.501 14.1016 16.5322 14.0781C16.8838 13.877 17.29 13.9434 17.666 14.0938C18.0146 14.2363 18.2773 14.498 18.6562 14.8672C19.0439 15.3145 19.1133 15.4395 19.334 15.7734C19.5078 16.0371 19.667 16.3066 19.7754 16.6152C19.8408 16.8066 19.7559 16.9648 19.5273 17.0625Z" fill="#4D6BFE"/>
                </svg>
            </div>
            <div class="message-content">
                ${thinkingHeader}
                <div class="message-text"></div>
                <div class="message-actions">
                    <button class="message-action-btn copy-message">
                        <i class="fas fa-copy"></i>复制
                    </button>
                    <button class="message-action-btn regenerate">
                        <i class="fas fa-sync-alt"></i>重新生成
                    </button>
                    <button class="message-action-btn like">
                        <i class="far fa-thumbs-up"></i>
                    </button>
                    <button class="message-action-btn dislike">
                        <i class="far fa-thumbs-down"></i>
                    </button>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
        scrollToBottom();
        return messageElement;
    }
    
    
    // 流式输出优化方案
async function processStreamResponse(response, aiMessageElement) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullContent = '';
    
    // 一次性获取消息文本元素
    const messageText = aiMessageElement.querySelector('.message-text');
    
    // 标记消息为正在流式处理
    aiMessageElement.classList.add('streaming');
    
    // 创建虚拟DOM元素用于渲染
    const virtualDom = document.createElement('div');
    
    // 创建打字机效果所需的变量
    let pendingChars = [];
    let isRendering = false;
    
    // 打字机效果渲染函数
    function renderNextChar() {
        if (pendingChars.length === 0) {
            isRendering = false;
            return;
        }
        
        isRendering = true;
        const nextChar = pendingChars.shift();
        
        // 将新字符添加到内容中
        fullContent += nextChar;
        
        // 将完整内容渲染到虚拟DOM
        virtualDom.innerHTML = renderMarkdown(fullContent);
        
        // 将虚拟DOM的内容转移到实际DOM
        messageText.innerHTML = virtualDom.innerHTML;
        
        // 处理代码块
        const codeBlocks = messageText.querySelectorAll('pre:not(.initialized)');
        codeBlocks.forEach(block => {
            block.classList.add('initialized');
            const copyBtn = block.querySelector('.copy-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', function() {
                    const code = block.querySelector('code');
                    if (code) {
                        navigator.clipboard.writeText(code.textContent);
                    }
                });
            }
        });
        
        // 平滑滚动
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 150) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        // 安排下一个字符的渲染
        requestAnimationFrame(() => {
            // 每帧最多处理3个字符，平衡流畅性和性能
            for (let i = 0; i < 3 && pendingChars.length > 0; i++) {
                const nextChar = pendingChars.shift();
                fullContent += nextChar;
            }
            
            // 更新渲染
            virtualDom.innerHTML = renderMarkdown(fullContent);
            messageText.innerHTML = virtualDom.innerHTML;
            
            // 继续渲染队列中的字符
            if (pendingChars.length > 0) {
                requestAnimationFrame(renderNextChar);
            } else {
                isRendering = false;
            }
        });
    }
    
    // 添加新字符到渲染队列
    function addToRenderQueue(chars) {
        for (const char of chars) {
            pendingChars.push(char);
        }
        
        if (!isRendering) {
            renderNextChar();
        }
    }
    
    try {
        // 处理流数据
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                // 处理可能剩余的字符
                if (pendingChars.length > 0 && !isRendering) {
                    renderNextChar();
                }
                break;
            }
            
            // 解码数据块
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // 高效处理SSE数据
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            // 收集本次块中的所有内容增量
            let newContentDelta = '';
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.substring(6);
                    
                    if (data === '[DONE]') continue;
                    
                    try {
                        const json = JSON.parse(data);
                        
                        if (json.choices && json.choices[0].delta && json.choices[0].delta.content) {
                            newContentDelta += json.choices[0].delta.content;
                        }
                    } catch (e) {
                        console.error('解析SSE数据失败:', e);
                    }
                }
            }
            
            // 将新内容添加到渲染队列
            if (newContentDelta.length > 0) {
                addToRenderQueue(newContentDelta);
            }
        }
    } catch (error) {
        console.error('流处理错误:', error);
    } finally {
        // 移除流式标记
        aiMessageElement.classList.remove('streaming');
    }
    
    return fullContent;
}


function showToast(message, type = 'info') {
        // 检查是否已存在Toast容器
        let toastContainer = document.querySelector('.toast-container');
        
        if (!toastContainer) {
            // 创建Toast容器
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // 创建Toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        // 添加到容器
        toastContainer.appendChild(toast);
        
        // 显示Toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 自动移除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    
    // 更新AI消息内容（流式输出）
    function updateAIMessage(messageElement, content) {
    if (!messageElement) return;
    
    const messageText = messageElement.querySelector('.message-text');
    if (!messageText) return;
    
    // 使用requestAnimationFrame优化渲染
    window.requestAnimationFrame(() => {
        // 格式化代码块
        const formattedContent = renderMarkdown(content);
        
        // 使用innerHTML而不是频繁创建DOM元素
        messageText.innerHTML = formattedContent;
        
        // 高效处理代码块复制按钮
        addCodeCopyButtons(messageElement);
        
        // 平滑滚动到底部
        smoothScrollToBottom();
    });
}


function smoothScrollToBottom() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
    });
}

// 4. 高效处理代码块复制按钮
function addCodeCopyButtons(messageElement) {
    const copyBtns = messageElement.querySelectorAll('.copy-btn:not(.initialized)');
    copyBtns.forEach(btn => {
        btn.classList.add('initialized');
        btn.addEventListener('click', function() {
            const codeElement = this.parentElement.nextElementSibling;
            navigator.clipboard.writeText(codeElement.textContent)
                .then(() => {
                    const originalText = this.textContent;
                    this.textContent = '已复制';
                    this.style.backgroundColor = '#10B981';
                    this.style.color = 'white';
                    
                    setTimeout(() => {
                        this.textContent = originalText;
                        this.style.backgroundColor = '';
                        this.style.color = '';
                    }, 2000);
                });
        });
    });
}

        
    
    
    // 完成AI消息流式输出
    function completeAIMessage(content) {
    // 添加到对话历史
    conversationHistory.push({
        role: 'assistant',
        content: content
    });
    
    // 停止思考计时器
    stopThinkingTimer();
    
    // 设置UI状态为空闲
    setUIState('idle');
    
    // 添加完成标识
    const currentAIMessage = document.getElementById('current-ai-message');
    if (currentAIMessage) {
        const messageContent = currentAIMessage.querySelector('.message-content');
        if (messageContent) {
            // 移除思考中动画
            const thinkingAnimation = messageContent.querySelector('.thinking-animation');
            if (thinkingAnimation) {
                thinkingAnimation.remove();
            }
            
            // 更新ID以便后续操作
            currentAIMessage.id = 'completed-message-' + Date.now();
        }
    }
}
    
    // 加载对话历史记录
    async function loadConversations() {
        try {
            const response = await fetch('index.php?api&action=get_conversations');
            const data = await response.json();
            
            if (data.success && data.conversations) {
                updateConversationsList(data.conversations);
            }
        } catch (error) {
            console.error('加载对话历史失败:', error);
        }
    }
    
    // 更新对话列表
    function updateConversationsList(conversations) {
        chatHistory.innerHTML = '';
        
        // 按日期分组
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        const lastMonth = new Date(today);
        lastMonth.setDate(lastMonth.getDate() - 30);
        
        // 分组
        const todayConvs = [];
        const yesterdayConvs = [];
        const weekConvs = [];
        const monthConvs = [];
        const olderConvs = [];
        
        conversations.forEach(conv => {
            const date = new Date(conv.updated_at * 1000);
            
            if (date >= today) {
                todayConvs.push(conv);
            } else if (date >= yesterday) {
                yesterdayConvs.push(conv);
            } else if (date >= lastWeek) {
                weekConvs.push(conv);
            } else if (date >= lastMonth) {
                monthConvs.push(conv);
            } else {
                olderConvs.push(conv);
            }
        });
        
        // 添加今天的对话
        if (todayConvs.length > 0) {
            addConversationGroup('今天', todayConvs);
        }
        
        // 添加昨天的对话
        if (yesterdayConvs.length > 0) {
            addConversationGroup('昨天', yesterdayConvs);
        }
        
        // 添加一周内的对话
        if (weekConvs.length > 0) {
            addConversationGroup('7 天内', weekConvs);
        }
        
        // 添加一月内的对话
        if (monthConvs.length > 0) {
            addConversationGroup('30 天内', monthConvs);
        }
        
        // 添加更早的对话
        if (olderConvs.length > 0) {
            addConversationGroup('更早', olderConvs);
        }
    }
    
    // 添加对话分组
    function addConversationGroup(title, conversations) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'time-group';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'time-label';
        titleDiv.textContent = title;
        
        groupDiv.appendChild(titleDiv);
        
        conversations.forEach(conv => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'chat-item';
            itemDiv.setAttribute('data-id', conv.id);
            
            if (currentConversationId === conv.id) {
                itemDiv.classList.add('active');
            }
            
            itemDiv.innerHTML = `
                <div class="chat-title">${conv.title}</div>
                <div class="chat-actions">
                    <button class="chat-action-btn" data-action="delete" data-id="${conv.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            groupDiv.appendChild(itemDiv);
            
            // 添加点击事件
            itemDiv.addEventListener('click', function(e) {
                if (e.target.closest('.chat-action-btn')) {
                    return; // 如果点击的是操作按钮，不触发对话加载
                }
                loadConversation(conv.id);
            });
        });
        
        chatHistory.appendChild(groupDiv);
        
        // 添加删除按钮事件
        groupDiv.querySelectorAll('.chat-action-btn[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                deleteConversation(id);
            });
        });
    }
    
    // 加载特定对话
    async function loadConversation(conversationId) {
        try {
            const response = await fetch(`index.php?api&action=get_conversation&conversation_id=${conversationId}`);
            const data = await response.json();
            
            if (data.success && data.conversation) {
                // 设置当前对话ID
                currentConversationId = conversationId;
                
                // 更新UI
                document.querySelectorAll('.chat-item').forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('data-id') === conversationId) {
                        item.classList.add('active');
                    }
                });
                
                // 清空聊天区域
                chatMessages.innerHTML = '';
                
                // 隐藏欢迎信息
                welcomeContainer.style.display = 'none';
                
                // 重置对话历史
                conversationHistory = [];
                
                // 加载消息
                data.conversation.messages.forEach(message => {
                    if (message.role === 'user') {
                        addUserMessage(message.content);
                    } else if (message.role === 'assistant') {
                        const aiMessage = addAIMessagePlaceholder();
                        updateAIMessage(aiMessage, message.content);
                        completeAIMessage(message.content);
                    } else if (message.role === 'system') {
                        // 系统消息不显示，但添加到历史
                        conversationHistory.push(message);
                    }
                });
                
                // 滚动到底部
                scrollToBottom();
            }
        } catch (error) {
            console.error('加载对话失败:', error);
        }
    }
    
    // 删除对话
    async function deleteConversation(conversationId) {
        if (!confirm('确定要删除这个对话吗？')) {
            return;
        }
        
        try {
            const response = await fetch('index.php?api&action=delete_conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ conversation_id: conversationId })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 如果删除的是当前对话，清空聊天区域并显示欢迎信息
                if (currentConversationId === conversationId) {
                    startNewChat();
                }
                
                // 重新加载对话列表
                loadConversations();
            }
        } catch (error) {
            console.error('删除对话失败:', error);
        }
    }
    
    

    
    // 发送消息到后端
    async function sendMessage() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;
        
        // 清空输入框并重置高度
        chatInput.value = '';
        chatInput.style.height = 'auto';
        toggleSendButton();
        
        // 设置UI为流式输出状态
        setUIState('streaming');
        
        // 创建或确保对话ID
        if (!currentConversationId) {
            currentConversationId = 'new-' + Date.now();
        }
        
        // 隐藏欢迎信息
        if (welcomeContainer) {
            welcomeContainer.style.display = 'none';
        }
        
        // 添加用户消息到聊天
        addUserMessage(userMessage);
        
        // 添加AI消息占位
        const aiMessageElement = addAIMessagePlaceholder();
        
        // 准备请求数据
        const requestData = {
            conversation_id: currentConversationId,
            messages: conversationHistory,
            deep_thinking: deepThinkingEnabled,
            temperature: parseFloat(userSettings.temperature),
            max_tokens: parseInt(userSettings.maxTokens),
            top_p: parseFloat(userSettings.topP),
            stream: true
        };
        
        // 如果有系统提示词，添加到请求中
        if (userSettings.systemPrompt && !conversationHistory.some(msg => msg.role === 'system')) {
            requestData.messages.unshift({
                role: 'system',
                content: userSettings.systemPrompt
            });
        }
        
        // 如果开启了联网搜索
        if (webSearchEnabled) {
            requestData.tools = [
                {
                    type: 'web_search'
                }
            ];
        }
        
        try {
            isStreaming = true;
            abortController = new AbortController();
            
            const response = await fetch('index.php?api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData),
                signal: abortController.signal
            });
            
            if (!response.ok) {
                const error = await response.text();
                try {
                    const errorJson = JSON.parse(error);
                    throw new Error(errorJson.error || '请求失败');
                } catch (e) {
                    throw new Error(error || '请求失败');
                }
            }
            
            // 使用优化的流处理方法
            const fullContent = await processStreamResponse(response, aiMessageElement);
            
            // 完成消息处理
            completeAIMessage(fullContent);
            
            // 重新加载对话列表
            loadConversations();
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('请求已取消');
            } else {
                console.error('API请求失败:', error);
                
                // 显示错误消息
                const messageText = aiMessageElement.querySelector('.message-text');
                messageText.innerHTML = `<div class="error-message">请求失败: ${error.message}</div>`;
                
                // 显示错误提示
                showToast('请求失败: ' + error.message, 'error');
                
                // 重置UI状态
                setUIState('idle');
            }
        } finally {
            // 不论成功或失败，最后恢复UI状态（如果没有被中止）
            if (isStreaming) {
                setUIState('idle');
            }
        }
    }
    
    
    
    
    
    function setUIState(state) {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatInputWrapper = document.querySelector('.chat-input-wrapper');
    const deepThinkingBtn = document.getElementById('deep-thinking-btn');
    const webSearchBtn = document.getElementById('web-search-btn');
    const uploadBtn = document.getElementById('upload-btn');
    
    switch(state) {
        case 'idle': // 空闲状态，可以输入
            isStreaming = false;
            
            // 恢复输入框状态
            chatInput.disabled = false;
            chatInput.classList.remove('disabled');
            chatInputWrapper.classList.remove('disabled');
            
            // 恢复发送按钮
            sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            sendBtn.classList.remove('abort-btn');
            sendBtn.title = '发送';
            
            // 恢复工具按钮
            uploadBtn.disabled = false;
            deepThinkingBtn.disabled = false;
            webSearchBtn.disabled = false;
            
            // 重新启用再生成按钮
            document.querySelectorAll('.regenerate').forEach(btn => {
                btn.classList.remove('disabled');
            });
            break;
            
        case 'streaming': // AI回答中
            isStreaming = true;
            
            // 禁用输入框
            chatInput.disabled = true;
            chatInput.classList.add('disabled');
            chatInputWrapper.classList.add('disabled');
            
            // 改变发送按钮为中止按钮
            sendBtn.innerHTML = '<i class="fas fa-times"></i>';
            sendBtn.classList.add('abort-btn');
            sendBtn.title = '中止生成';
            sendBtn.disabled = false;
            
            // 禁用工具按钮
            uploadBtn.disabled = true;
            deepThinkingBtn.disabled = true;
            webSearchBtn.disabled = true;
            
            // 禁用所有再生成按钮
            document.querySelectorAll('.regenerate').forEach(btn => {
                btn.classList.add('disabled');
            });
            break;
    }
}


// 3. 添加中止响应功能
function abortResponse() {
    if (isStreaming && abortController) {
        abortController.abort();
        
        // 立即更新UI状态
        setUIState('idle');
        
        // 添加中止指示到当前消息
        const currentAIMessage = document.getElementById('current-ai-message');
        if (currentAIMessage) {
            const messageText = currentAIMessage.querySelector('.message-text');
            if (messageText) {
                // 添加生成中止通知
                messageText.innerHTML += '<div style="margin-top: 10px; color: #EF4444; font-size: 13px;">[生成已中止]</div>';
            }
            
            // 更新ID，以便下次可以创建新消息
            currentAIMessage.id = 'aborted-message-' + Date.now();
        }
    }
}


    
    // 重新生成回答
   function regenerateResponse(button) {
    // 检查是否在流式输出中，如果是则不执行
    if (isStreaming) return;
    
    // 检查按钮是否被禁用
    if (button.classList.contains('disabled')) return;
    
    // 移除最后一条AI回复
    if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].role === 'assistant') {
        conversationHistory.pop();
    }
    
    // 找到最后一条用户消息的下一个AI消息
    const messages = document.querySelectorAll('.message');
    let lastUserIndex = -1;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].classList.contains('user-message')) {
            lastUserIndex = i;
            break;
        }
    }
    
    if (lastUserIndex !== -1 && lastUserIndex + 1 < messages.length) {
        // 移除该AI消息
        messages[lastUserIndex + 1].remove();
    }
    
    // 设置UI为流式输出状态
    setUIState('streaming');
    
    // 显示提示
    showToast('正在重新生成回答...');
    
    // 重新发送请求
    sendMessage();
}
    
    // 开始新对话
    function startNewChat() {
        // 重置对话ID
        currentConversationId = null;
        
        // 清空对话历史
        conversationHistory = [];
        
        // 清空聊天界面，显示欢迎消息
        chatMessages.innerHTML = '';
        welcomeContainer.style.display = 'block';
        
        // 移除所有对话的活动状态
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 重置深度思考和联网搜索按钮
        deepThinkingEnabled = false;
        webSearchEnabled = false;
        deepThinkingBtn.classList.remove('active');
        webSearchBtn.classList.remove('active');
        
        // 移动端关闭侧边栏
        if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
            toggleSidebar();
        }
    }
    
    // 保存用户设置
    function saveSettings() {
        userSettings = {
            systemPrompt: document.getElementById('system-prompt').value,
            temperature: parseFloat(temperatureSlider.value),
            maxTokens: parseInt(maxTokensSlider.value),
            topP: parseFloat(topPSlider.value)
        };
        
        localStorage.setItem('deepseekUserSettings', JSON.stringify(userSettings));
        closeModals();
    }
    
    // 关闭所有模态框
    function closeModals() {
        settingsModal.style.display = 'none';
        authorModal.style.display = 'none';
        uploadModal.style.display = 'none';
    }
    
    // 处理文件上传
    function handleFileUpload(files) {
        for (const file of files) {
            if (selectedFiles.some(f => f.name === file.name)) continue;
            
            // 添加文件到列表
            selectedFiles.push(file);
            
            // 显示文件在上传列表中
            const fileElement = document.createElement('div');
            fileElement.className = 'upload-file-item';
            
            // 根据文件类型选择图标
            let fileIcon = 'fa-file';
            const fileExt = file.name.split('.').pop().toLowerCase();
            
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt)) {
                fileIcon = 'fa-file-image';
            } else if (['pdf'].includes(fileExt)) {
                fileIcon = 'fa-file-pdf';
            } else if (['doc', 'docx'].includes(fileExt)) {
                fileIcon = 'fa-file-word';
            } else if (['xls', 'xlsx', 'csv'].includes(fileExt)) {
                fileIcon = 'fa-file-excel';
            } else if (['ppt', 'pptx'].includes(fileExt)) {
                fileIcon = 'fa-file-powerpoint';
            } else if (['zip', 'rar', '7z'].includes(fileExt)) {
                fileIcon = 'fa-file-archive';
            } else if (['txt', 'md'].includes(fileExt)) {
                fileIcon = 'fa-file-alt';
            } else if (['js', 'py', 'java', 'c', 'cpp', 'php', 'html', 'css'].includes(fileExt)) {
                fileIcon = 'fa-file-code';
            }
            
            fileElement.innerHTML = `
                <div class="upload-file-icon">
                    <i class="fas ${fileIcon}"></i>
                </div>
                <div class="upload-file-info">
                    <div class="upload-file-name">${file.name}</div>
                    <div class="upload-file-size">${formatFileSize(file.size)}</div>
                </div>
                <button class="upload-file-remove" data-file="${file.name}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            uploadFileList.appendChild(fileElement);
        }
        
        // 绑定删除按钮事件
        document.querySelectorAll('.upload-file-remove').forEach(btn => {
            btn.addEventListener('click', function() {
                const fileName = this.getAttribute('data-file');
                selectedFiles = selectedFiles.filter(f => f.name !== fileName);
                this.closest('.upload-file-item').remove();
            });
        });
    }
    
    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }
    
    // 确认上传文件
    async function confirmUpload() {
        if (selectedFiles.length === 0) {
            closeModals();
            return;
        }
        
        try {
            // 显示上传进度
            const progressElement = document.createElement('div');
            progressElement.className = 'upload-progress';
            progressElement.innerHTML = `
                <div class="upload-progress-text">正在上传文件...</div>
                <div class="upload-progress-bar">
                    <div class="progress-inner"></div>
                </div>
            `;
            uploadFileList.appendChild(progressElement);
            
            // 创建表单数据
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('files[]', file);
            });
            
            // 上传文件
            const response = await fetch('index.php', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('文件上传失败');
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '文件上传失败');
            }
            
            // 构建文件信息消息
            const fileNames = result.files.map(file => file.original_name).join(', ');
            const userMessage = `我上传了以下文件: ${fileNames}`;
            
            // 清理上传列表和选择的文件
            selectedFiles = [];
            uploadFileList.innerHTML = '';
            closeModals();
            
            // 创建或确保对话ID
            if (!currentConversationId) {
                currentConversationId = 'new-' + Date.now();
            }
            
            // 隐藏欢迎信息
            welcomeContainer.style.display = 'none';
            
            // 添加用户消息到聊天
            addUserMessage(userMessage);
            
            // 添加文件信息到对话（用于后端处理）
            const fileInfo = result.files.map(file => ({
                name: file.original_name,
                path: file.path,
                type: file.type,
                size: file.size
            }));
            
            // 添加AI消息占位
            const aiMessageElement = addAIMessagePlaceholder();
            
            // 准备请求数据
            const requestData = {
                conversation_id: currentConversationId,
                messages: conversationHistory,
                files: fileInfo,
                deep_thinking: deepThinkingEnabled,
                temperature: parseFloat(userSettings.temperature),
                max_tokens: parseInt(userSettings.maxTokens),
                top_p: parseFloat(userSettings.topP),
                stream: true
            };
            
            // 如果有系统提示词，添加到请求中
            if (userSettings.systemPrompt && !conversationHistory.some(msg => msg.role === 'system')) {
                requestData.messages.unshift({
                    role: 'system',
                    content: userSettings.systemPrompt
                });
            }
            
            // 发送请求处理文件
            isStreaming = true;
            abortController = new AbortController();
            
            const chatResponse = await fetch('index.php?api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData),
                signal: abortController.signal
            });
            
            if (!chatResponse.ok) {
                throw new Error('处理文件请求失败');
            }
            
            const reader = chatResponse.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let fullContent = '';
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    break;
                }
                
                // 将二进制数据转换为文本
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                
                // 处理SSE数据
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        
                        if (data === '[DONE]') {
                            continue;
                        }
                        
                        try {
                            const json = JSON.parse(data);
                            
                            if (json.choices && json.choices[0].delta && json.choices[0].delta.content) {
                                fullContent += json.choices[0].delta.content;
                                updateAIMessage(aiMessageElement, fullContent);
                            }
                        } catch (e) {
                            console.error('解析SSE数据失败:', e);
                        }
                    }
                }
            }
            
            // 完成消息处理
            completeAIMessage(fullContent);
            
            // 重新加载对话列表
            loadConversations();
            
        } catch (error) {
            console.error('处理上传失败:', error);
            alert('上传文件处理失败: ' + error.message);
            closeModals();
        }
    }
    
    // 初始化事件监听器
    function initEventListeners() {
        // 加载对话历史
        loadConversations();
        
        // 侧边栏切换
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
        mobileSidebarBtn.addEventListener('click', toggleSidebar);
        
        // 输入框高度自适应
        chatInput.addEventListener('input', function() {
            adjustTextareaHeight();
            toggleSendButton();
        });
        
        // 输入框按键事件 (Enter发送)
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendBtn.disabled) {
                    sendMessage();
                }
            }
        });
        
        // 发送按钮点击
        sendBtn.addEventListener('click', function() {
    if (isStreaming) {
        // 如果正在流式输出，点击按钮执行中止
        abortResponse();
    } else {
        // 否则执行发送
        sendMessage();
    }
});
        
        // 新对话按钮
        newChatBtn.addEventListener('click', startNewChat);
       document.querySelectorAll('.new-chat-btn, .refresh-btn').forEach(btn => {
    btn.addEventListener('click', startNewChat);
});
        
        // 深度思考切换
        deepThinkingBtn.addEventListener('click', function() {
            deepThinkingEnabled = !deepThinkingEnabled;
            this.classList.toggle('active');
        });
        
        // 联网搜索切换
        webSearchBtn.addEventListener('click', function() {
            webSearchEnabled = !webSearchEnabled;
            this.classList.toggle('active');
        });
        
        // 设置按钮
        settingsBtn.addEventListener('click', function() {
            initSettingsUI();
            settingsModal.style.display = 'block';
        });
        
        // 作者信息按钮
        authorInfoBtn.addEventListener('click', function() {
            authorModal.style.display = 'block';
        });
        
        // 上传按钮
        uploadBtn.addEventListener('click', function() {
            uploadModal.style.display = 'block';
        });
        
        // 关闭模态框按钮
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', closeModals);
        });
        
        // 保存设置按钮
        saveSettingsBtn.addEventListener('click', saveSettings);
        
        // 设置滑块值显示
        temperatureSlider.addEventListener('input', function() {
            temperatureValue.textContent = this.value;
        });
        
        maxTokensSlider.addEventListener('input', function() {
            maxTokensValue.textContent = this.value;
        });
        
        topPSlider.addEventListener('input', function() {
            topPValue.textContent = this.value;
        });
        
        // 上传区域点击
        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });
        
        // 文件输入变化
        fileInput.addEventListener('change', function() {
            handleFileUpload(this.files);
        });
        
        // 文件拖放
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            handleFileUpload(e.dataTransfer.files);
        });
        
        // 确认上传按钮
        confirmUploadBtn.addEventListener('click', confirmUpload);
        
        // 文件上传按钮
        hiddenFileInput.addEventListener('change', function() {
            selectedFiles = [];
            uploadFileList.innerHTML = '';
            handleFileUpload(this.files);
            uploadModal.style.display = 'block';
        });
        
        // 窗口点击事件关闭模态框
        window.addEventListener('click', function(e) {
            if (e.target === settingsModal) {
                settingsModal.style.display = 'none';
            } else if (e.target === authorModal) {
                authorModal.style.display = 'none';
            } else if (e.target === uploadModal) {
                uploadModal.style.display = 'none';
            }
        });
    }
    
    
    
    let thinkingTimer;
let thinkingSeconds = 0;

function startThinkingTimer(thinkingElement) {
    // 清除可能存在的计时器
    if (thinkingTimer) {
        clearInterval(thinkingTimer);
        thinkingSeconds = 0;
    }
    
    const timerElement = thinkingElement.querySelector('.thinking-timer');
    if (!timerElement) return;
    
    // 启动新计时器
    thinkingTimer = setInterval(() => {
        thinkingSeconds++;
        timerElement.textContent = `(用时 ${thinkingSeconds} 秒)`;
    }, 1000);
}

function stopThinkingTimer() {
    if (thinkingTimer) {
        clearInterval(thinkingTimer);
        thinkingTimer = null;
    }
}
    
    // 初始化应用
   function initApp() {
    initEventListeners();
    setUIState('idle');
    toggleSendButton();
    enableCopyFunctionality();
    addStreamingStyles(); // 添加流式样式
}
    
    // 启动应用
    initApp();
});