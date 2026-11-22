function toBase64Unicode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function uploadScriptToGitHub({ token, owner, repo, content }) {
  const scriptId = "darkai_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
  const filePath = `scripts/${scriptId}.lua`;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  const response = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `DarkAI: Add protected script ${scriptId}`,
      content: toBase64Unicode(content),
      branch: "main"
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message || `Không thể upload lên GitHub (${response.status})`);
  }

  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
  return {
    scriptId,
    rawUrl,
    loadstring: `loadstring(game:HttpGet("${rawUrl}"))()`
  };
}
