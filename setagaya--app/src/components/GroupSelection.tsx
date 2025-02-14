import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GroupSelection.css";

const GroupSelection: React.FC = () => {
    const [groupId, setGroupId] = useState("");
    const [error, setError] = useState(""); // ✅ エラーメッセージを管理
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value;

        // ✅ 半角数字のみ許可（全角数字はエラー）
        if (/[\uFF10-\uFF19]/.test(input)) {
            setError("半角の数字で入力してください。");
        } else {
            setError(""); // エラー解除
        }

        // ✅ 全角数字を半角に変換
        input = input.replace(/[\uFF10-\uFF19]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));

        setGroupId(input);
    };

    const handleJoinChat = () => {
        if (!groupId.trim()) {
            setError("グループ番号を入力してください。");
            return;
        }

        if (!/^\d+$/.test(groupId)) {
            setError("半角数字のみ入力してください。");
            return;
        }

        navigate(`/chat/${groupId}`);
    };

    return (
        <div className="group-selection-container">
            <h1>生成AIと議論をしてみよう🎉<br />グループ番号を入力してね</h1>
            <input
                type="text"
                placeholder="グループ番号を入力"
                value={groupId}
                onChange={handleChange}
                className="group-input"
            />
            {error && <p className="error-message">{error}</p>} {/* ✅ エラーメッセージ表示 */}
            <button onClick={handleJoinChat} className="join-button">
                チャット開始
            </button>
        </div>
    );
};

export default GroupSelection;
