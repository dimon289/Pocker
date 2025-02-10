import { Outlet } from "react-router-dom"
import { useDispatch, useSelector} from "react-redux";
import { useEffect } from "react";
import {RootState} from "../../Store"
import { Link } from "react-router-dom";
import {changeName, changeAvatar, changeDescription, changeEmail, increaseBalance} from "../../Slices/userSlice";
import "./style.css"
import axios from "axios";

function home(){
    const dispatch = useDispatch();
    const name = useSelector((state:RootState) => state.user.userName);
    let balance = useSelector((state:RootState) => state.user.balance);
    
    useEffect(() => {
        const email = localStorage.getItem("email");
        const password = localStorage.getItem("password");


        if (email && password) {
            const fetchUserData = async () => {
                try {
                    const user = await axios({
                        method:"get",
                        url: `http://localhost:3210/api/user/email?email=${email}`});

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
                    }};
            fetchUserData();
        }
    }, [dispatch])


    return ( 
    <>
        {name.length !== 0?
        <header>    
            
            <div className="user"><Link to="User">{name}</Link></div>
            <div className="balance">{balance.toLocaleString('en-US', {
                                                            style: 'currency',
                                                            currency: 'USD',
                                                            minimumFractionDigits: 2, // кількість знаків після коми
                                                            maximumFractionDigits: 2, // обмежуємо до 2 знаків
                                                            })}</div>
        </header>:
        <header>
            <div><Link to="/Register">Registre</Link></div>
            <div><Link to="/Login">LogIN</Link></div>
        </header>}
        <Outlet/>        
    </>
    )
}

export default home
