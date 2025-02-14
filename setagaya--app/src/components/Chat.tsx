import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getChatResponse } from "../api";
import { db } from "../firebaseConfig";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import { Send, XCircle } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import "./Chat.css";
import profileIcon from "./profile.webp";
import Lottie from "lottie-react";
import loadingAnimation from "./loading_1.json";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";

type ChatMessage = { role: "user" | "assistant"; content: string; timestamp: string };

const Chat: React.FC = () => {
    const { groupId } = useParams<{ groupId?: string }>();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getFormattedTimestamp = (): string => {
        return new Date().toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const sendMessage = async () => {
        if (!input.trim() || !groupId) return;

        const userMessage: ChatMessage = { role: "user", content: input, timestamp: getFormattedTimestamp() };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        try {
            const response = await getChatResponse([...messages, userMessage]);

            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: response || "応答がありません。",
                timestamp: getFormattedTimestamp(),
            };

            setMessages((prev) => [...prev, assistantMessage]);

            setIsTyping(false);
        } catch (error) {
            console.error("エラー:", error);
            toast.error("エラーが発生しました。");
            setIsTyping(false);
        }
    };

    // ✅ メッセージが更新されるたびに Firestore に保存する
    useEffect(() => {
        if (!groupId || messages.length === 0) return;

        const saveChatToFirestore = async () => {
            try {
                const sessionRef = doc(db, "sessions", groupId);

                await setDoc(sessionRef, {
                    createdAt: getFormattedTimestamp(),
                    messages: messages,
                }, { merge: true });

            } catch (error) {
                console.error("Firestore 保存エラー:", error);
                toast.error("チャット履歴の保存に失敗しました。");
            }
        };

        saveChatToFirestore();
    }, [messages, groupId]); // messages が更新されるたびに Firestore に保存

    const navigate = useNavigate();

    const endChat = async () => {
        if (!groupId) return;
        try {
            await updateDoc(doc(db, "sessions", groupId), {
                endedAt: getFormattedTimestamp(),
            });
            toast.success("チャット履歴を保存しました！");
            
            setTimeout(() => {
                navigate("/"); // ✅ Firestore 保存後に `/` に遷移
            }, 6000); // ✅ 1秒後にリダイレクト（トースト表示の時間を確保）
        } catch (error) {
            console.error("Firestore 保存エラー:", error);
            toast.error("チャット履歴の保存に失敗しました。");
        }
    };

    if (!groupId) {
        return <div className="error-message">Error: グループIDが見つかりません</div>;
    }

    return (
        <div className="chat-container">
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
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        <div className="timestamp">{msg.timestamp}</div>
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
            <ToastContainer />
        </div>
    );
};

export default Chat;
