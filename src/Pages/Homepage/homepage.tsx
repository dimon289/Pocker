import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { RootState } from "../../Store";
import { Link } from "react-router-dom";
import { changeName, changeAvatar, changeDescription, changeEmail, increaseBalance } from "../../Slices/userSlice";
import "./style.css";
import axios from "axios";
import { BurgerMenu } from "./burgermenu";
const apiUrl = import.meta.env.VITE_API_URL;

function Home() {
    const dispatch = useDispatch();
    const name = useSelector((state: RootState) => state.user.userName);
    const balance = useSelector((state: RootState) => state.user.balance);
    console.log(import.meta.env.VITE_API_URL);

    useEffect(() => {
        const email = localStorage.getItem("email");
        const password = localStorage.getItem("password");

        if (email && password) {
            const fetchUserData = async () => {
                console.log(`${apiUrl}/api/user/email?email=${email}`)
                try {
                    const user = await axios({
                        method: "get",
                        url: `${apiUrl}/api/user/email?email=${email}`,
                    });

                    if (user.data.avatar == null) {
                        user.data.avatar = "";
                    }

                    dispatch(changeName(user.data.nickname));
                    dispatch(changeEmail(user.data.email));
                    dispatch(changeDescription(user.data.description));
                    dispatch(increaseBalance(user.data.mybalance));
                    dispatch(changeAvatar(user.data.avatar));
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            };
            fetchUserData();
        }
    }, [dispatch]);

    return (
        <>
        <header className="poker-header">
            <div className="burger-menu">
                <BurgerMenu />
            </div>
            {name.length !== 0 ? (
                <div>
                    <div className="user">
                        <Link to="User">{name}</Link>
                    </div>
                    <div className="balance">
                        {(balance * 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </div>
                </div>
            ) : (
                <div>
                    <div><Link to="/Register" className="register-link">Register</Link></div>
                    <div><Link to="/Login" className="login-link">LogIn</Link></div>
                </div>
            )}
        </header>
        <Outlet />
    </>
    );
}

export default Home;
