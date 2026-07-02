import AdminDashboard from "./assets/pages/admin/AdminDashboard";
import "./App.css";

function App() {
  return (
    <div
      style={{
        background: "radial-gradient(135% 135% at 50% 0%, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
        minHeight: "100vh",
        minWidth: "100vw",
        overflow: "hidden"
      }}
    >
      <AdminDashboard />
    </div>
  );
}

export default App;