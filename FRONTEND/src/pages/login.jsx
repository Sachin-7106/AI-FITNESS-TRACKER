import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const endpoint = isLogin ? "/login" : "/register";
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:5000"}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("username", isLogin ? data.username : username);
        navigate("/dashboard");
      } else {
        setError(data.error || "An error occurred");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-zinc-950 p-8 rounded-3xl border border-zinc-800">
        <h1 className="text-white text-4xl font-bold text-center mb-2">
          GainLens AI
        </h1>
        <p className="text-zinc-400 text-center mb-8">
          {isLogin ? "Welcome back! Please login." : "Create a new account."}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-zinc-300 block mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-zinc-300 block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 transition-all duration-300 text-white p-4 rounded-xl font-bold text-lg"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="text-zinc-400 text-center mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-400 font-semibold ml-2 hover:underline"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}