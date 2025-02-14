import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import "./GroupSelection.css";

const activityTitles: { [key: string]: string } = {
    practice: "📝 生成AIの練習をしよう",
    hallucination: "🌀 ハルシネーションを起こそう",
    problemsolving: "💡 生成AIで問題解決をしてみよう",
};

const GroupSelection: React.FC = () => {
    const [groupId, setGroupId] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    
    // URL パラメータから category を取得
    const queryParams = new URLSearchParams(location.search);
    const category = queryParams.get("category") || "sessions";

    // 選択されたアクティビティのタイトルを取得（不明な場合はデフォルト）
    const activityTitle = activityTitles[category] || "🤖 生成AIと議論をしてみよう";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value;
        if (/[\uFF10-\uFF19]/.test(input)) {
            setError("半角の数字で入力してください。");
        } else {
            setError("");
        }
        input = input.replace(/[\uFF10-\uFF19]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
        setGroupId(input);
    };

    const handleJoinChat = async () => {
        if (!groupId.trim()) {
            setError("グループ番号を入力してください。");
            return;
        }
        if (!/^\d+$/.test(groupId)) {
            setError("半角数字のみ入力してください。");
            return;
        }
        
        // Firestore に選択したカテゴリに基づいて保存
        try {
            const sessionRef = doc(db, category, groupId);
            await setDoc(sessionRef, { createdAt: new Date().toISOString(), messages: [] }, { merge: true });
            // navigate 時に state として category を渡す
            navigate(`/chat/${groupId}`, { state: { category } });
        } catch (error) {
            console.error("Firestore 保存エラー:", error);
            setError("データの保存に失敗しました。");
        }
    };

    return (
        <div className="group-selection-container">
            <h1>{activityTitle} 🎉<br />グループ番号を入力してね</h1>
            <input
                type="text"
                placeholder="グループ番号を入力"
                value={groupId}
                onChange={handleChange}
                className="group-input"
            />
            {error && <p className="error-message">{error}</p>}
            <button onClick={handleJoinChat} className="join-button">チャット開始</button>
        </div>
    );
};

export default GroupSelection;
