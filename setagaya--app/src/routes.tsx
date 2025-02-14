import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GroupSelection from "./components/GroupSelection";
import Chat from "./components/Chat";
import DatabaseVisualization from "./components/DatabaseVisualization";

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GroupSelection />} />
        <Route path="/chat/:groupId" element={<Chat />} />
        <Route path="/database-visualization" element={<DatabaseVisualization />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
