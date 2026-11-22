export async function generateLuauScript(apiKey, userPrompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const systemInstruction = `
Bạn là DarkAI — trợ lý chuyên gia lập trình Roblox Luau.
Nhiệm vụ: Viết một script Roblox Luau hoàn chỉnh, sạch, tối ưu, không lỗi cú pháp dựa trên yêu cầu của người dùng.
Quy tắc bắt buộc:
1. Chỉ trả về duy nhất mã nguồn Luau thuần túy.
2. KHÔNG bọc trong markdown (\`\`\`lua hoặc \`\`\`), KHÔNG giải thích bên ngoài code.
3. Sử dụng các API chuẩn hiện đại của Roblox (task.wait, task.spawn, Players.LocalPlayer, TweenService, Instance.new...).
4. Bọc pcall ở những đoạn dễ phát sinh lỗi để script chạy ổn định.
`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096
      }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Lỗi Gemini API (${response.status})`);
  }

  const data = await response.json();
  let code = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  code = code.replace(/^```(?:lua|luau)?\s*/i, "").replace(/\s*```$/i, "").trim();

  if (!code) throw new Error("DarkAI chưa tạo được code, ông mô tả chi tiết hơn xíu nha!");
  return code;
}
