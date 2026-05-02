const chatArea = document.getElementById('chatArea');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

let chatHistory = [];
const API_KEY = "sk-Xwuy2wMYjTTZIUbBuHUewSsu6Na8RkUjBvYiDgHdJFTCw0aX";

// Custom renderer for code blocks with copy functionality
const renderer = new marked.Renderer();
renderer.code = (codeBlock) => {
    const codeText = typeof codeBlock === 'string' ? codeBlock : (codeBlock.text || '');
    const id = 'code-' + Math.random().toString(36).substring(2, 11);
    const escapedCode = codeText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `
        <div class="code-block-wrapper">
            <button class="copy-code-trigger" data-copy-id="${id}">
                <i class="far fa-copy"></i> COPY
            </button>
            <pre><code id="${id}" class="language-text">${escapedCode}</code></pre>
        </div>
    `;
};
marked.setOptions({ renderer: renderer, breaks: true, gfm: true });

// Global copy handler using event delegation
document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.copy-code-trigger');
    if (copyBtn) {
        const codeId = copyBtn.getAttribute('data-copy-id');
        if (codeId) {
            const codeElement = document.getElementById(codeId);
            if (codeElement) {
                const textToCopy = codeElement.innerText;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalHTML = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> COPIED';
                    copyBtn.style.background = '#22c55e';
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                        copyBtn.style.background = 'rgba(255, 255, 255, 0.08)';
                    }, 1800);
                }).catch(() => {});
            }
        }
    }
});

// --- INSTALLER ANIMATION FOR TIKTOK ---
const ttBtn = document.getElementById('ttBtn');
const ttUrl = document.getElementById('ttUrl');
const ttResult = document.getElementById('ttResult');
const instModal = document.getElementById('installerModal');
const instContent = document.getElementById('installerContent');
const instStatus = document.getElementById('installStatus');
const instProgress = document.getElementById('installProgress');
const percentLabel = document.getElementById('percentLabel');

function updateProgress(percent, statusText) {
    instProgress.style.width = percent + '%';
    percentLabel.innerText = percent + '%';
    if(statusText) instStatus.innerText = statusText;
}

function showInstaller() {
    instModal.classList.remove('hidden');
    setTimeout(() => {
        instModal.classList.add('opacity-100');
        instContent.classList.remove('scale-95');
        instContent.classList.add('scale-100');
    }, 10);
}

function hideInstaller() {
    instModal.classList.remove('opacity-100');
    instContent.classList.add('scale-95');
    setTimeout(() => {
        instModal.classList.add('hidden');
        updateProgress(0, "Initializing...");
        instStatus.classList.remove('text-green-500', 'text-red-500');
    }, 400);
}

ttBtn.onclick = async () => {
    const url = ttUrl.value.trim();
    if(!url) {
        ttResult.innerText = "⚠️ Paste TikTok link first!";
        ttResult.classList.remove('hidden');
        setTimeout(() => ttResult.classList.add('hidden'), 2000);
        return;
    }
    
    ttBtn.disabled = true;
    ttBtn.style.opacity = '0.6';
    showInstaller();

    try {
        updateProgress(10, "Connecting to API...");
        const apiRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const res = await apiRes.json();
        
        if(res.code === 0 && res.data && res.data.play) {
            updateProgress(35, "Bypassing firewall...");
            
            const videoUrl = res.data.play;
            const response = await fetch(videoUrl);
            const reader = response.body.getReader();
            const contentLength = parseInt(response.headers.get('Content-Length') || '0');
            
            let receivedLength = 0;
            let chunks = []; 
            
            while(true) {
                const {done, value} = await reader.read();
                if (done) break;
                chunks.push(value);
                receivedLength += value.length;
                
                if (contentLength > 0) {
                    const percent = Math.min(95, 35 + Math.floor((receivedLength / contentLength) * 60));
                    updateProgress(percent, `Downloading: ${Math.round(receivedLength/1024/1024 * 10)/10}MB`);
                } else {
                    updateProgress(65, "Processing stream...");
                }
            }

            updateProgress(98, "Finalizing...");
            const blob = new Blob(chunks);
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = `X14_TikTok_${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            
            updateProgress(100, "Installation Complete!");
            instStatus.classList.add('text-green-500');
            setTimeout(() => {
                hideInstaller();
                ttResult.innerText = "✅ Video downloaded successfully!";
                ttResult.classList.remove('hidden');
                setTimeout(() => ttResult.classList.add('hidden'), 2500);
            }, 1000);
        } else {
            throw new Error("Invalid link or private video");
        }
    } catch (e) {
        console.error(e);
        instStatus.innerText = "Download Failed!";
        instStatus.classList.add('text-red-500');
        updateProgress(100, "Error");
        setTimeout(hideInstaller, 1800);
        ttResult.innerText = "❌ Failed to download. Check link!";
        ttResult.classList.remove('hidden');
        setTimeout(() => ttResult.classList.add('hidden'), 2500);
    } finally {
        ttBtn.disabled = false;
        ttBtn.style.opacity = '1';
    }
}

// Menu controls for mobile
function toggleMenu(show) {
    if(show) {
        sidebar.classList.add('open');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('opacity-100'), 10);
        document.body.style.overflow = 'hidden';
    } else {
        sidebar.classList.remove('open');
        overlay.classList.remove('opacity-100');
        setTimeout(() => {
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
        }, 400);
    }
}

menuBtn.onclick = () => toggleMenu(true);
closeBtn.onclick = () => toggleMenu(false);
overlay.onclick = () => toggleMenu(false);

function createBubble(text, role) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble bubble-${role}`;
    
    const content = document.createElement('div');
    content.className = "markdown-content";
    if (role === 'ai') {
        content.innerHTML = marked.parse(text);
    } else {
        content.innerText = text;
    }
    bubble.appendChild(content);

    chatArea.appendChild(bubble);
    chatArea.scrollTop = chatArea.scrollHeight;
    return bubble;
}

async function handleChat() {
    const text = userInput.value.trim();
    if(!text) return;

    createBubble(text, 'user');
    userInput.value = '';
    userInput.style.height = 'auto';

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-bubble bubble-ai flex gap-1.5 items-center px-5 py-3 w-16';
    typingDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatArea.appendChild(typingDiv);
    chatArea.scrollTop = chatArea.scrollHeight;

    try {
        const response = await fetch("https://api.chatanywhere.tech/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system", 
                        content: "You are XFourteenAI, a Senior Software Engineer. Provide high-quality code in markdown blocks. Keep responses concise but helpful. Respond in user's language."
                    }, 
                    ...chatHistory.slice(-8), 
                    {role: "user", content: text}
                ],
                temperature: 0.3
            })
        });

        const data = await response.json();
        const aiMsg = data.choices && data.choices[0] ? data.choices[0].message.content : "System error. Retry.";
        
        typingDiv.remove();
        createBubble(aiMsg, 'ai');
        chatHistory.push({role: "user", content: text}, {role: "assistant", content: aiMsg});
        if (chatHistory.length > 20) chatHistory = chatHistory.slice(-18);
    } catch (e) {
        console.error(e);
        typingDiv.remove();
        createBubble("⚠️ Neural connection disrupted. Please check API key or network.", 'ai');
    }
}

sendBtn.onclick = handleChat;
userInput.onkeydown = (e) => { 
    if(e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault(); 
        handleChat(); 
    } 
};

userInput.oninput = function() { 
    this.style.height = 'auto'; 
    this.style.height = Math.min(this.scrollHeight, 140) + 'px'; 
};

// Theme toggle placeholder (visual only)
document.getElementById('themeToggle')?.addEventListener('click', () => {
    // Just visual feedback - actual theme would require more changes
    alert("Theme customization available in premium build");
});

window.onload = () => {
    setTimeout(() => {
        const loadingEl = document.getElementById('loading');
        if(loadingEl) {
            loadingEl.style.opacity = '0';
            setTimeout(() => loadingEl.remove(), 700);
        }
    }, 1200);
    setTimeout(() => {
        createBubble("XFourteenAI active. How can I assist your code mission, Commander?", 'ai');
    }, 300);
};

// Fix body scroll on mobile when modal opens
document.addEventListener('touchmove', (e) => {
    if (sidebar.classList.contains('open') && e.target.closest('.sidebar') === null) {
        e.preventDefault();
    }
}, { passive: false });