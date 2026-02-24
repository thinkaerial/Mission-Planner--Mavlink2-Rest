// src/layouts/AppLayout.jsx
import React from "react";
import Header from "../components/common/Header";

const AppLayout = ({ children }) => {
  return (
    <div
      className="h-screen w-screen grid"
      style={{ gridTemplateRows: "auto 1fr" }}
    >
      <div className="relative z-30">
        <Header />
      </div>
      <main className="relative z-10 bg-[#0f172a] overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
