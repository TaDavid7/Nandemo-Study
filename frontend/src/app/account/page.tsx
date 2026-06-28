"use client";
import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";

export default function AccountPage(){
    const [mode, setMode] = useState<"login" | "register">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("username");
        if(storedUser) setUser(storedUser);
    }, []);

    const submit = async () => {
        setError(null);

        const res = await fetch(`/api/${mode}`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username, password}),
        });

        const data = await res.json();
        if(!res.ok){
            setError(data.error || "Something went wrong");
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        setUser(data.username);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setUser(null);
        setUsername("");
        setPassword("");
    };

    if(user){
        return(
            <div className = "p-6">
                <h1 className = "text-2xl font-bond">Welcome, {user}!</h1>
                <p className = "mt-2">You're logged in</p>
                <button
                    onClick = {logout}
                    className = "mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                    Logout
                </button>
            </div>
        );
    }

    return(
        <div className = "p-6 max-w-md mx-auto">
            <h1 className = "text-2xl font-bond mb-4">
                {mode === "login" ? "Login" : "Register"}
            </h1>
            {error && <div className = "text-red-500 mb-3">{error}</div>}
            <input
                type = "text"
                placeholder = "Username"
                className = "w-full p-2 border rounded mb-2"
                value = {username}
                onChange = {(e) => setUsername(e.target.value)}
            />
            <input
                type = "password"
                placeholder = "Password"
                className = "w-full p-2 border rounded mb-4"
                value={password}
                onChange = {(e) => setPassword(e.target.value)}
            />
                
            <button
                onClick = {submit}
                className = "w-full bg-blue-500 text-white px4 py-2 rounded hover:bg-blue-600"
            >
                {mode === "login" ? "Login" : "Register"}
            </button>
            <p className = "mt-4 text-center text-sm">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                    onClick = {() => setMode(mode === "login" ? "register" : "login")}
                    className = "text-indigo-500 underline"
                >
                    {mode === "login" ? "Register here" : "Login instead"}
                </button>
            </p>
        </div>
    )


}