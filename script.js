// --- VIEWPORT FIX FOR MOBILE ---
function updateViewportHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', updateViewportHeight);
window.addEventListener('orientationchange', updateViewportHeight);
updateViewportHeight();

// --- CORE VARIABLES ---
const chatArea = document.getElementById('chatArea');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const ttBtn = document.getElementById('ttBtn');
const ttUrl = document.getElementById('ttUrl');
const ttResult = document.getElementById('ttResult');

let chatHistory = [];
const API_KEY = "sk-Xwuy2wMYjTTZIUbBuHUewSsu6Na8RkUjBvYiDgHdJFTCw0aX";

// --- MARKED RENDERER ---
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

// --- COPY FUNCTION ---
document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.copy-code-trigger');
    if (copyBtn) {
        const codeId = copyBtn.getAttribute('data-copy-id');
        const codeElement = document.getElementById(codeId);
        if (codeElement) {
            navigator.clipboard.writeText(codeElement.innerText).then(() => {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> COPIED';
                setTimeout(() => { copyBtn.innerHTML = originalHTML; }, 1800);
            });
        }
    }
});

// --- CHAT LOGIC ---
function createBubble(text, role) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble bubble-${role}`;
    const content = document.createElement('div');
    content.className = "markdown-content";
    if (role === 'ai') { content.innerHTML = marked.parse(text); } 
    else { content.innerText = text; }
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
                    {role: "system", content: "You are XFourteenAI, a Senior Software Engineer. Respond in user's language."},
                    ...chatHistory.slice(-8),
                    {role: "user", content: text}
                ],
                temperature: 0.3
            })
        });
        const data = await response.json();
        const aiMsg = data.choices[0].message.content;
        typingDiv.remove();
        createBubble(aiMsg, 'ai');
        chatHistory.push({role: "user", content: text}, {role: "assistant", content: aiMsg});
    } catch (e) {
        typingDiv.remove();
        createBubble("⚠️ Connection error.", 'ai');
    }
}

// --- TIKTOK DOWNLOADER ---
ttBtn.onclick = async () => {
    const url = ttUrl.value.trim();
    if(!url) return;
    ttBtn.disabled = true;
    try {
        const apiRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const res = await apiRes.json();
        if(res.code === 0) {
            window.open(res.data.play, '_blank');
            ttResult.innerText = "✅ Download started";
        }
    } catch (e) { ttResult.innerText = "❌ Error"; }
    ttBtn.disabled = false;
};

// --- EVENTS ---
sendBtn.onclick = handleChat;
userInput.onkeydown = (e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); }};
userInput.oninput = function() { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 140) + 'px'; };
menuBtn.onclick = () => { sidebar.classList.add('open'); overlay.classList.remove('hidden'); setTimeout(()=>overlay.classList.add('opacity-100'),10); };
closeBtn.onclick = () => { sidebar.classList.remove('open'); overlay.classList.remove('opacity-100'); setTimeout(()=>overlay.classList.add('hidden'),400); };
overlay.onclick = closeBtn.onclick;

window.onload = () => {
    setTimeout(() => document.getElementById('loading')?.remove(), 1200);
    setTimeout(() => createBubble("XFourteenAI active. How can I assist, Commander?", 'ai'), 300);
};
