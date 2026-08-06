import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";

function App() {
  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="mx-auto max-w-7xl p-4 pb-16 md:p-6 md:pb-20">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
