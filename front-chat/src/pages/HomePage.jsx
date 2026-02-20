import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import JoinCreateChat from "../components/JoinCreateChat";

const HomePage = () => {
  const { token } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (token) {
    return <JoinCreateChat />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">

      <div className="bg-white p-8 rounded-xl shadow-md w-96">

        <div className="flex justify-center gap-6 mb-6">
          <button
            className={`font-semibold ${isLogin ? "text-blue-500" : ""}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>

          <button
            className={`font-semibold ${!isLogin ? "text-blue-500" : ""}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        {isLogin ? <LoginPage /> : <RegisterPage />}

      </div>
    </div>
  );
};

export default HomePage;