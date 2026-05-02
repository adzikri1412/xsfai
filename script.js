// --- VIEWPORT FIX ---
function updateVH() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', updateVH);
updateVH();

// --- VARIABLES ---
const chatArea = document.getElementById('chatArea');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const instModal = document.getElementById('installerModal');
const instTitle = document.getElementById('instTitle');
const instStatus = document.getElementById('installStatus');
const instProgress = document.getElementById('installProgress');
const percentLabel = document.getElementById('percentLabel');
const manualArea = document.getElementById('manualDownloadArea');
const manualLink = document.getElementById('manualLink');

const API_KEY = "sk-Xwuy2wMYjTTZIUbBuHUewSsu6Na8RkUjBvYiDgHdJFTCw0aX";

// --- SIDEBAR ---
menuBtn.onclick = () => sidebar.classList.add('open');
document.getElementById('closeBtn').onclick = () => sidebar.classList.remove('open');

// --- INSTALLER UI ---
function startInstaller(title) {
    instTitle.innerText = title;
    instModal.classList.remove('hidden');
    manualArea.classList.add('hidden');
    instStatus.classList.remove('text-green-400', 'text-red-500');
    updateProgress(10, "INITIALIZING...");
    setTimeout(() => instModal.classList.add('opacity-100'), 10);
}

function updateProgress(p, status) {
    instProgress.style.width = p + '%';
    percentLabel.innerText = p + '%';
    if(status) instStatus.innerText = status;
}

async function triggerDownload(url, filename) {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        const dUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return true;
    } catch(e) { return false; }
}

// --- TIKTOK (VIDEO & AUDIO) ---
async function downloadTikTok(mode) {
    const url = document.getElementById('ttUrl').value.trim();
    if(!url) return;
    startInstaller(mode === 'audio' ? "INSTALLING SOUND" : "INSTALLING VIDEO");

    try {
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if(json.code === 0) {
            const mediaUrl = mode === 'audio' ? json.data.music : json.data.play;
            updateProgress(50, "CONNECTING TO NEURAL LINK...");
            
            manualLink.href = mediaUrl;
            manualArea.classList.remove('hidden');

            const success = await triggerDownload(mediaUrl, `X14_${Date.now()}.${mode === 'audio' ? 'mp3' : 'mp4'}`);
            if(success) {
                updateProgress(100, "INSTALLATION COMPLETE!");
                instStatus.classList.add('text-green-400');
            } else {
                updateProgress(100, "AUTO INSTALL FAILED - USE MANUAL LINK");
            }
        }
    } catch(e) { updateProgress(100, "ERROR: LINK INVALID"); instStatus.classList.add('text-red-500'); }
}

document.getElementById('ttBtn').onclick = () => downloadTikTok('video');
document.getElementById('ttAudioBtn').onclick = () => downloadTikTok('audio');

// --- SPOTIFY ---
document.getElementById('spotBtn').onclick = async () => {
    const url = document.getElementById('spotUrl').value.trim();
    if(!url) return;
    startInstaller("INSTALLING SPOTIFY TRACK");

    try {
        // Menggunakan API Spotify Downloader (Publik/DziyX Bypass)
        const res = await fetch(`https://api.spotifydown.com/download/${url.split('track/')[1].split('?')[0]}`, {
            headers: { 'Origin': 'https://spotifydown.com' }
        });
        const json = await res.json();
        if(json.success) {
            updateProgress(60, "SYNCING METADATA...");
            manualLink.href = json.link;
            manualArea.classList.remove('hidden');
            
            await triggerDownload(json.link, `${json.metadata.title}.mp3`);
            updateProgress(100, "SYNC COMPLETE!");
            instStatus.classList.add('text-green-400');
        }
    } catch(e) { updateProgress(100, "SPOTIFY SYNC FAILED"); instStatus.classList.add('text-red-500'); }
};

// --- CHAT ENGINE ---
function createBubble(text, role) {
    const b = document.createElement('div');
    b.className = `chat-bubble bubble-${role}`;
    b.innerHTML = role === 'ai' ? marked.parse(text) : text;
    chatArea.appendChild(b);
    chatArea.scrollTop = chatArea.scrollHeight;
}

sendBtn.onclick = async () => {
    const text = userInput.value.trim();
    if(!text) return;
    createBubble(text, 'user');
    userInput.value = '';
    const typing = document.createElement('div');
    typing.className = 'chat-bubble bubble-ai w-16 flex gap-1 items-center justify-center';
    typing.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatArea.appendChild(typing);

    try {
        const response = await fetch("https://api.chatanywhere.tech/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
            body: JSON.stringify({ model: "gpt-3.5-turbo", messages: [{role: "user", content: text}] })
        });
        const data = await response.json();
        typing.remove();
        createBubble(data.choices[0].message.content, 'ai');
    } catch (e) { typing.remove(); createBubble("Neural connection disrupted.", "ai"); }
};

window.onload = () => {
    setTimeout(() => document.getElementById('loading').remove(), 1000);
    createBubble("System ready. All download protocols (TikTok & Spotify) are active.", "ai");
};
