import { useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/auth";

function OAuth2Success() {

    const navigate = useNavigate();

    const [params] = useSearchParams();

    const { updateAuth } = useContext(AuthContext);

    useEffect(() => {

        const token = params.get("token");

        if (!token) {
            navigate("/login");
            return;
        }

        const payload = JSON.parse(atob(token.split(".")[1]));
        const role = payload.role;

        localStorage.setItem("token", token);
        localStorage.setItem("role", role);

        updateAuth(token, role);

        setTimeout(() => {
            navigate("/dashboard");
        }, 100);

    }, []);

    return <h2>Signing you in...</h2>;

}

export default OAuth2Success;