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

// --- FIXED INSTALLER UI FUNCTION ---
function startInstaller(title) {
    // Reset State
    instProgress.style.width = '0%';
    percentLabel.innerText = '0%';
    instTitle.innerText = title;
    instStatus.innerText = "INITIALIZING...";
    instStatus.classList.remove('text-green-400', 'text-red-500');
    manualArea.classList.add('hidden');
    
    // Munculkan Modal
    instModal.classList.remove('hidden');
    
    // Paksa browser merender animasi sebelum proses fetch dimulai
    requestAnimationFrame(() => {
        instModal.classList.add('opacity-100');
    });
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
        window.URL.revokeObjectURL(dUrl);
        return true;
    } catch(e) { 
        console.error("Download failed", e);
        return false; 
    }
}

// --- TIKTOK LOGIC ---
async function downloadTikTok(mode) {
    const url = document.getElementById('ttUrl').value.trim();
    if(!url) return;

    startInstaller(mode === 'audio' ? "INSTALLING SOUND" : "INSTALLING VIDEO");

    // Beri jeda sedikit agar animasi muncul mulus di mobile
    await new Promise(r => setTimeout(r, 600));

    try {
        updateProgress(30, "FETCHING FROM NEURAL LINK...");
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        
        if(json.code === 0) {
            const mediaUrl = mode === 'audio' ? json.data.music : json.data.play;
            updateProgress(60, "EXTRACTING DATA...");
            
            manualLink.href = mediaUrl;
            manualArea.classList.remove('hidden');

            const success = await triggerDownload(mediaUrl, `X14_${Date.now()}.${mode === 'audio' ? 'mp3' : 'mp4'}`);
            
            if(success) {
                updateProgress(100, "INSTALLATION COMPLETE!");
                instStatus.classList.add('text-green-400');
                setTimeout(() => {
                    instModal.classList.remove('opacity-100');
                    setTimeout(() => instModal.classList.add('hidden'), 400);
                }, 2500);
            } else {
                updateProgress(100, "AUTO INSTALL BLOCKED");
                instStatus.innerText = "TAP MANUAL LINK BELOW";
            }
        } else {
            throw new Error("Invalid Response");
        }
    } catch(e) { 
        updateProgress(100, "LINK ERROR / PROTECTED"); 
        instStatus.classList.add('text-red-500'); 
    }
}

document.getElementById('ttBtn').onclick = () => downloadTikTok('video');
document.getElementById('ttAudioBtn').onclick = () => downloadTikTok('audio');

// --- SPOTIFY LOGIC ---
document.getElementById('spotBtn').onclick = async () => {
    const url = document.getElementById('spotUrl').value.trim();
    if(!url || !url.includes('track/')) return;
    
    startInstaller("INSTALLING SPOTIFY TRACK");
    await new Promise(r => setTimeout(r, 600));

    try {
        const trackId = url.split('track/')[1].split('?')[0];
        updateProgress(40, "SYNCING WITH SPOTIFY...");
        
        const res = await fetch(`https://api.spotifydown.com/download/${trackId}`, {
            headers: { 'Origin': 'https://spotifydown.com' }
        });
        const json = await res.json();
        
        if(json.success) {
            updateProgress(70, "CONVERTING TO MP3...");
            manualLink.href = json.link;
            manualArea.classList.remove('hidden');
            
            const success = await triggerDownload(json.link, `${json.metadata.title}.mp3`);
            if(success) {
                updateProgress(100, "SYNC COMPLETE!");
                instStatus.classList.add('text-green-400');
                setTimeout(() => {
                    instModal.classList.remove('opacity-100');
                    setTimeout(() => instModal.classList.add('hidden'), 400);
                }, 2500);
            }
        }
    } catch(e) { 
        updateProgress(100, "SPOTIFY SYNC FAILED"); 
        instStatus.classList.add('text-red-500'); 
    }
};

// --- CHAT ENGINE (Tetap sama) ---
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
    setTimeout(() => {
        const loader = document.getElementById('loading');
        if(loader) loader.remove();
    }, 1000);
};
