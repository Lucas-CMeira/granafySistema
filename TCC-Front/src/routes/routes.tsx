import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages/login/login-page";
import HomePage from "../pages/home/home-page";
import App from "../App";
import ProfilePage from "../pages/profile/profile-page";
import CadastroPage from "../pages/login/cadastro-page";
import ProtectedRoute from "./ProtectedRoute";
import EntriesPage from "../pages/entries/entries-page";
import GoalsPage from "../pages/goals/goals-page";

const routes = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/cadastro",
    element: <CadastroPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path: "/entries",
        element: <EntriesPage />,
      },
      {
        path: "/goals",
        element: <GoalsPage />,
      },
    ],
  },
]);

export default routes;