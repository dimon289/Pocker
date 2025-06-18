import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { RootState } from "../../Store";
import { Link } from "react-router-dom";
import { changeName, changeAvatar, changeDescription, changeEmail, increaseBalance, ChangeUserId } from "../../Slices/userSlice";
import "./style.css";
import axios from "axios";
import { BurgerMenu } from "./burgermenu";
const apiUrl = import.meta.env.VITE_API_URL;

function Home() {
    const dispatch = useDispatch();
    const name = useSelector((state: RootState) => state.user.userName);
    const balance = useSelector((state: RootState) => state.user.balance);

    useEffect(() => {
        const token = localStorage.getItem("token")
        let intervalId: any;
;
        if (token) {
            console.log(import.meta.env.VITE_API_URL);
            const fetchUserData = async () => {
                try {
                    const auth = await axios({
                        method: "get",
                        url: `${apiUrl}/api/user/profile`,
                        headers:{
                            'Authorization':`Bearer ${token}`
                        }
                    })
                    if(auth.data.email){
                        const user = await axios({
                            method: "get",
                            url: `${apiUrl}/api/user/email?email=${auth.data.email}`,
                        });

                        if (user.data.avatar == null) {
                            user.data.avatar = "";
                        }
                        dispatch(ChangeUserId(user.data.id))
                        dispatch(changeName(user.data.nickname));
                        dispatch(changeEmail(user.data.email));
                        dispatch(changeDescription(user.data.description));
                        dispatch(increaseBalance(user.data.mybalance));
                        dispatch(changeAvatar(user.data.avatar));
                    } 
                }
                catch (error) {
                    console.error("Error fetching user data:", error);
                    localStorage.removeItem("token")
                    clearInterval(intervalId);
                }}
                fetchUserData();
            }
    },[]);

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
