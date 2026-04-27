import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import Navbar from "../navbar/Navbar";

function MainLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(true);

  return (
    <div
      className="d-flex"
      style={{ minHeight: "100vh", background: "#eaf2f7" }}
    >
      <Sidebar abierto={sidebarAbierto} setAbierto={setSidebarAbierto} />

      <div
        className="flex-grow-1 p-4"
        style={{
          transition: "margin-left 0.3s ease",
        }}
      >
        <Navbar />

        <div className="mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default MainLayout;
