import { useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/auth";
function OAuth2Success() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { updateAuth } = useContext(AuthContext);
  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const payload = token.split(".")[1];
      const role = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).role;

      if (!role) {
        throw new Error("Missing role");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      updateAuth(token, role);
      navigate("/dashboard", { replace: true });
    } catch {
      navigate("/login?error=Unable%20to%20complete%20Google%20sign-in.", { replace: true });
    }
  }, [token, navigate, updateAuth]);
  return (
    <div>
      <h2>Signing you in...</h2>
    </div>
  );
}

export default OAuth2Success;
