import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // ✅ マークダウンの拡張対応
import Papa from "papaparse"; // ✅ CSV変換ライブラリ
import "./DatabaseVisualization.css";

interface ChatMessage {
    role: string;
    content: string;
    timestamp: string;  // ✅ `string` に統一
}

interface SessionData {
    id: string; // グループ番号
    createdAt: string;  // ✅ `string` に統一
    endedAt?: string;   // ✅ `string` に統一
    messages: ChatMessage[];
}

const formatTimestamp = (timestamp: Timestamp | string | undefined): string => {
    if (!timestamp) return "未設定";

    if (typeof timestamp === "string") return timestamp; // すでに文字列ならそのまま返す

    return new Date(timestamp.seconds * 1000).toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

const DatabaseVisualization: React.FC = () => {
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [expandedSession, setExpandedSession] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "sessions"));
            const sessionData: SessionData[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    createdAt: formatTimestamp(data.createdAt),
                    endedAt: formatTimestamp(data.endedAt),
                    messages: data.messages.map((msg: any) => ({
                        ...msg,
                        timestamp: formatTimestamp(msg.timestamp),
                    })),
                };
            });

            // ✅ グループ番号順にソート（数値として比較）
            sessionData.sort((a, b) => Number(a.id) - Number(b.id));

            setSessions(sessionData);
        } catch (error) {
            console.error("Firestore データ取得エラー:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const toggleSessionDetails = (sessionId: string) => {
        setExpandedSession(expandedSession === sessionId ? null : sessionId);
    };

    // ✅ CSVダウンロード処理

    const downloadCSV = () => {
        if (sessions.length === 0) {
            alert("ダウンロードするデータがありません。");
            return;
        }
    
        // CSVデータを構築
        const csvData = sessions.flatMap(session => 
            session.messages.map(msg => ({
                "グループ番号": session.id,
                "開始時刻": session.createdAt,
                "終了時刻": session.endedAt || "未終了",
                "送信者": msg.role,
                "メッセージ内容": msg.content,
                "送信時刻": msg.timestamp
            }))
        );
    
        // CSVに変換（UTF-8 + BOM付き）
        const csvString = "\uFEFF" + Papa.unparse(csvData);
    
        // CSVをダウンロード
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "chat_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    

    return (
        <div className="database-container">
            <h1 className="database-title">Firestore データ可視化</h1>

            <div className="database-buttons">
                <button className="database-refresh-button" onClick={fetchSessions}>
                    🔄 最新のデータを取得
                </button>
                <button className="database-download-button" onClick={downloadCSV}>
                    📥 CSVダウンロード
                </button>
            </div>

            {loading ? (
                <p className="database-loading-text">データを取得中...</p>
            ) : (
                <table className="database-table">
                    <thead>
                        <tr>
                            <th>グループ番号</th>
                            <th>開始時刻</th>
                            <th>終了時刻</th>
                            <th>メッセージ数</th>
                            <th>詳細</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map(session => (
                            <React.Fragment key={session.id}>
                                <tr>
                                    <td>{session.id}</td>
                                    <td>{session.createdAt}</td>
                                    <td>{session.endedAt || "未終了"}</td>
                                    <td>{session.messages.length}</td>
                                    <td>
                                        <button 
                                            className="database-expand-button" 
                                            onClick={() => toggleSessionDetails(session.id)}
                                        >
                                            {expandedSession === session.id ? "▲ 閉じる" : "▼ 詳細"}
                                        </button>
                                    </td>
                                </tr>
                                {expandedSession === session.id && (
                                    <tr>
                                        <td colSpan={5}>
                                            <div className="database-message-container">
                                                <h3>メッセージ一覧</h3>
                                                <table className="database-message-table">
                                                    <thead>
                                                        <tr>
                                                            <th>送信者</th>
                                                            <th>メッセージ内容</th>
                                                            <th>送信時刻</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {session.messages.map((msg, index) => (
                                                            <tr key={index}>
                                                                <td className={`database-role ${msg.role}`}>{msg.role}</td>
                                                                <td className="database-message-content">
                                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                        {msg.content}
                                                                    </ReactMarkdown>
                                                                </td>
                                                                <td className="database-timestamp">{msg.timestamp}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default DatabaseVisualization;
