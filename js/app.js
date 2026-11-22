import { generateLuauScript } from "./ai_generator.js?v=2";
import { protectLuauScript } from "./obfuscator.js";
import { uploadScriptToGitHub } from "./github_api.js";

const DEFAULT_GEMINI_KEY = "AQ.Ab8RN6IjBKVwkwlqGcu2cmptu4JPjyEF933w8pHbuWWBTT-_rw";

const els = {
  toggleConfigBtn: document.getElementById("toggleConfigBtn"),
  configPanel: document.getElementById("configPanel"),
  geminiKey: document.getElementById("geminiKey"),
  githubToken: document.getElementById("githubToken"),
  githubOwner: document.getElementById("githubOwner"),
  githubRepo: document.getElementById("githubRepo"),
  enableObfuscate: document.getElementById("enableObfuscate"),
  enableEnvCheck: document.getElementById("enableEnvCheck"),
  saveConfigBtn: document.getElementById("saveConfigBtn"),
  chatContainer: document.getElementById("chatContainer"),
  promptInput: document.getElementById("promptInput"),
  sendBtn: document.getElementById("sendBtn")
};

function loadConfig() {
  const saved = JSON.parse(localStorage.getItem("darkai_cfg") || "{}");
  els.geminiKey.value = saved.geminiKey || DEFAULT_GEMINI_KEY;
  els.githubToken.value = saved.githubToken || "";
  els.githubOwner.value = saved.githubOwner || "";
  els.githubRepo.value = saved.githubRepo || "";

  // Tự mở bảng cấu hình nếu chưa điền GitHub Token/Repo
  if (!saved.githubToken || !saved.githubOwner || !saved.githubRepo) {
    els.configPanel.classList.remove("hidden");
  }
}

els.toggleConfigBtn.addEventListener("click", () => {
  els.configPanel.classList.toggle("hidden");
});

els.saveConfigBtn.addEventListener("click", () => {
  const cfg = {
    geminiKey: els.geminiKey.value.trim(),
    githubToken: els.githubToken.value.trim(),
    githubOwner: els.githubOwner.value.trim(),
    githubRepo: els.githubRepo.value.trim()
  };
  localStorage.setItem("darkai_cfg", JSON.stringify(cfg));
  els.configPanel.classList.add("hidden");
  appendAIMessage("✅ Đã lưu cấu hình DarkAI vào trình duyệt!");
});

function appendUserMessage(text) {
  const div = document.createElement("div");
  div.className = "message user";
  div.innerHTML = `
    <div class="avatar">U</div>
    <div class="bubble"><p>${escapeHtml(text)}</p></div>
  `;
  els.chatContainer.appendChild(div);
  els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
}

function appendAIMessage(htmlContent) {
  const div = document.createElement("div");
  div.className = "message ai";
  div.innerHTML = `
    <div class="avatar">D</div>
    <div class="bubble">${htmlContent}</div>
  `;
  els.chatContainer.appendChild(div);
  els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
  return div;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function handleSend() {
  const prompt = els.promptInput.value.trim();
  if (!prompt) return;

  const geminiKey = els.geminiKey.value.trim();
  const token = els.githubToken.value.trim();
  const owner = els.githubOwner.value.trim();
  const repo = els.githubRepo.value.trim();

  if (!geminiKey || !token || !owner || !repo) {
    els.configPanel.classList.remove("hidden");
    appendAIMessage("⚠️ Ông bấm vào **⚙️ Cấu hình** phía trên để điền đủ GitHub Token, Username và Tên Repo trước nha!");
    return;
  }

  els.promptInput.value = "";
  els.promptInput.style.height = "auto";
  appendUserMessage(prompt);

  els.sendBtn.disabled = true;
  const loadingMsg = appendAIMessage(`<p>⏳ <strong>DarkAI</strong> đang viết script Luau...</p>`);
  const bubble = loadingMsg.querySelector(".bubble");

  try {
    const rawCode = await generateLuauScript(geminiKey, prompt);

    bubble.innerHTML = `<p>🛡️ Đang mã hóa bảo mật &amp; đóng gói...</p>`;
    const protectedCode = protectLuauScript(rawCode, {
      obfuscate: els.enableObfuscate.checked,
      envCheck: els.enableEnvCheck.checked
    });

    bubble.innerHTML = `<p>☁️ Đang đẩy script lên GitHub để xuất Loadstring...</p>`;
    const result = await uploadScriptToGitHub({
      token,
      owner,
      repo,
      content: protectedCode
    });

    bubble.innerHTML = `
      <p>🎉 Script của ông xong rồi đây! Đã bật bảo mật <strong>DarkAI</strong>:</p>
      <div class="loadstring-card">
        <small>🔗 Loadstring (Bấm Copy để dùng):</small>
        <div class="loadstring-row">
          <input type="text" value='${escapeHtml(result.loadstring)}' readonly />
          <button class="btn-copy">Copy</button>
        </div>
      </div>
      <details class="code-details">
        <summary>👁️ Xem code Luau gốc DarkAI đã viết</summary>
        <pre><code>${escapeHtml(rawCode)}</code></pre>
      </details>
    `;

    const copyBtn = bubble.querySelector(".btn-copy");
    const inputEl = bubble.querySelector("input");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(inputEl.value);
      copyBtn.textContent = "Đã Copy! ✅";
      setTimeout(() => (copyBtn.textContent = "Copy"), 2000);
    });
  } catch (err) {
    bubble.innerHTML = `<p>❌ Lỗi rồi ông ơi: ${escapeHtml(err.message)}</p>`;
  } finally {
    els.sendBtn.disabled = false;
    els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
  }
}

els.sendBtn.addEventListener("click", handleSend);

// Nhấn Enter để gửi, Shift+Enter để xuống dòng
els.promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// Tự giãn chiều cao ô nhập trên điện thoại/máy tính
els.promptInput.addEventListener("input", () => {
  els.promptInput.style.height = "auto";
  els.promptInput.style.height = Math.min(els.promptInput.scrollHeight, 120) + "px";
});

loadConfig();
