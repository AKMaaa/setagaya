import React from "react";
import { useNavigate } from "react-router-dom";
import "./SelectionActivity.css";

const SelectionActivity: React.FC = () => {
    const navigate = useNavigate();

    const handleSelection = (category: string) => {
        navigate(`/group-selection?category=${category}`);
    };

    return (
        <div className="selection-container">
            <h1>何をしてみる？🤔</h1>
            <button className="selection-button" onClick={() => handleSelection("practice")}>
                📝 生成AIの練習をしよう
            </button>
            <button className="selection-button" onClick={() => handleSelection("hallucination")}>
                🌀 ハルシネーションを起こそう
            </button>
            <button className="selection-button" onClick={() => handleSelection("problemsolving")}>
                💡 生成AIで問題解決をしてみよう
            </button>
        </div>
    );
};

export default SelectionActivity;
