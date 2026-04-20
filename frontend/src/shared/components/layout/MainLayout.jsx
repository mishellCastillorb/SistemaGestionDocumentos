import { Outlet } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import Navbar from "../navbar/Navbar";

function MainLayout() {
  return (
    <div className="d-flex" style={{ minHeight: "100vh", background: "#eaf2f7" }}>
      <Sidebar />

      <div className="flex-grow-1 p-4">
        <Navbar />

        <div className="mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default MainLayout;