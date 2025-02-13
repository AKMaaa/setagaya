import React, { useState, useRef, useEffect } from "react";
import { getChatResponse } from "../api";
import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import { Send, MessageCircle, XCircle } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import "./Chat.css";
import profileIcon from "./profile.webp";
import Lottie from "lottie-react";
import loadingAnimation from "./loading_1.json";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ✅ `system` を含めた型定義
type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const Chat: React.FC = () => {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [chatStarted, setChatStarted] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ✅ Firestore には保存せず、ローカルで管理
    const startChat = () => {
        setChatStarted(true);
        setMessages([]); // 履歴をクリア
    };

    // ✅ メッセージ送信時は Firestore に保存しない
    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: ChatMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        try {
            const promptMessages: ChatMessage[] = [
                { role: "system", content: "あなたは親切なアシスタントです。" },
                ...messages,
                userMessage
            ];

            const response = await getChatResponse(promptMessages);
            const assistantMessage: ChatMessage = { role: "assistant", content: response || "" };
            setMessages((prev) => [...prev, assistantMessage]);

        } catch (error) {
            toast.error("エラーが発生しました。");
        } finally {
            setIsTyping(false);
        }
    };

    // ✅ Firestore には終了時にのみ保存
    const endChat = async () => {
        if (!messages.length) {
            toast.warn("メッセージがないため、保存しません。");
            setChatStarted(false);
            return;
        }

        try {
            await addDoc(collection(db, "sessions"), {
                createdAt: new Date(),
                messages: messages, // ✅ すべてのメッセージを Firestore に保存
                endedAt: new Date(),
            });
            toast.success("チャット履歴を保存しました！");
        } catch (error) {
            console.error("Firestore 保存エラー:", error);
            toast.error("チャット履歴の保存に失敗しました。");
        }

        setChatStarted(false);
        setMessages([]);
    };

    return (
        <div className="chat-container">
            {!chatStarted ? (
                <div className="welcome-screen">
                    <h1 className="chat-title">Chat Assistant</h1>
                    <p>ChatGPTとお話してみよう！</p>
                    <button className="start-button" onClick={startChat}>
                        <MessageCircle className="icon" /> チャットを開始
                    </button>
                </div>
            ) : (
                <>
                    <h1 className="chat-title">Chat Assistant</h1>
                    <button className="end-button" onClick={endChat}>
                        <XCircle className="icon" /> チャットを終了
                    </button>

                    <div className="chat-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.role}`}>
                                {msg.role === "assistant" && (
                                    <img src={profileIcon} alt="ChatGPT" className="chatgpt-icon" />
                                )}
                                <div className="message-bubble">
                                    {msg.role === "assistant" ? (
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="typing-animation">
                                <Lottie animationData={loadingAnimation} loop={true} className="lottie-animation" />
                                <span>考え中...</span>
                            </div>
                        )}
                        <div ref={chatEndRef}></div>
                    </div>

                    <div className="chat-input-container">
                        <input
                            className="chat-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="メッセージを入力..."
                        />
                        <button className="send-button" onClick={sendMessage}>
                            <Send className="send-icon" />
                        </button>
                    </div>
                </>
            )}
            <ToastContainer />
        </div>
    );
};

export default Chat;
