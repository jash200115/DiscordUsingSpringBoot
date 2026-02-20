import { useState } from "react";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await axios.post(
      "http://localhost:8080/api/auth/login",
      { email, password }
    );

    login(res.data);

    navigate("/chat");
  };

  return (
    <div className="flex flex-col items-center mt-20 gap-4">
      <input
        className="border p-2"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2"
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2"
        onClick={handleLogin}
      >
        Login
      </button>
    </div>
  );
};

export default LoginPage;