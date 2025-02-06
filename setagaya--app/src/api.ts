import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY!,
  dangerouslyAllowBrowser: true, // ブラウザ環境での利用を許可
});

export const getChatResponse = async (
  messages: { role: "user" | "system" | "assistant"; content: string }[]
) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages.map((msg) => ({
      role: msg.role, // 型を固定
      content: msg.content,
    })),
  });

  return response.choices[0]?.message?.content;
};
