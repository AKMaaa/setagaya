import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // マークダウン拡張
import Papa from "papaparse";      // CSV変換
import "./DatabaseVisualization.css"; // 既存のCSSにドロップダウンCSSを追加してください

interface ChatMessage {
  role: string;
  content: string;
  timestamp: string; // 文字列に統一
}

interface SessionData {
  id: string;        // ドキュメントID
  createdAt: string; // string
  endedAt?: string;  // string
  messages: ChatMessage[];
}

// タイムスタンプを文字列に変換する関数
const formatTimestamp = (timestamp: Timestamp | string | undefined): string => {
  if (!timestamp) return "未設定";

  if (typeof timestamp === "string") {
    return timestamp; // すでに文字列ならそのまま使用
  }

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
  // 選択中のコレクションをステート管理
  // "hallucination" | "practice" | "problemsolving" の三択
  const [activeCollection, setActiveCollection] = useState<"hallucination" | "practice" | "problemsolving">("hallucination");

  // Firestore から取得したセッションデータ
  const [sessions, setSessions] = useState<SessionData[]>([]);
  
  // 詳細を開いているセッションID
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // ローディング状態
  const [loading, setLoading] = useState(true);

  // Firestore からコレクションデータを取得する関数
  const fetchData = async (collectionName: string) => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
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

      // ドキュメントIDが数字の場合にソートしたいなら下記のように
      // sessionData.sort((a, b) => Number(a.id) - Number(b.id));

      setSessions(sessionData);
    } catch (error) {
      console.error("Firestore データ取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  // activeCollection が変わるたびにデータを再取得
  useEffect(() => {
    fetchData(activeCollection);
  }, [activeCollection]);

  // セッションの詳細表示を切り替え
  const toggleSessionDetails = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  // CSV ダウンロード処理
  const downloadCSV = () => {
    if (sessions.length === 0) {
      alert("ダウンロードするデータがありません。");
      return;
    }

    // CSVデータ用に変形
    const csvData = sessions.flatMap(session =>
      session.messages.map(msg => ({
        "ドキュメントID": session.id,
        "開始時刻": session.createdAt,
        "終了時刻": session.endedAt || "未終了",
        "送信者": msg.role,
        "メッセージ内容": msg.content,
        "送信時刻": msg.timestamp,
      }))
    );

    // UTF-8 + BOM で CSV 文字列に変換
    const csvString = "\uFEFF" + Papa.unparse(csvData);

    // ダウンロード用 Blob を生成
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // コレクション名付きでファイル名を作成
    link.setAttribute("download", `${activeCollection}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="database-container">
      <h1 className="database-title">Firestore データ可視化</h1>

      {/* ドロップダウン部分 */}
      <div className="collection-select-container">
        <select
          className="collection-dropdown"
          value={activeCollection}
          onChange={(e) => setActiveCollection(e.target.value as "hallucination" | "practice" | "problemsolving")}
        >
          <option value="hallucination">🌀 ハルシネーションを起こそう</option>
          <option value="practice">📝 生成AIの練習をしよう</option>
          <option value="problemsolving">💡 生成AIで問題解決をしてみよう</option>
        </select>
      </div>

      {/* ボタン群 */}
      <div className="database-buttons">
        <button className="database-refresh-button" onClick={() => fetchData(activeCollection)}>
          🔄 再読み込み
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

                {/* 詳細部分 */}
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
