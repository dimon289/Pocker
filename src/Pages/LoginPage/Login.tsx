import {useNavigate} from "react-router-dom"
import { useState } from "react";
import { useSelector, useDispatch} from "react-redux";
import {changeName, changeAvatar, changeDescription, changeEmail, increaseBalance} from "../../Slices/userSlice";
import { RootState } from "../../Store";
import axios from 'axios';
import "./style.css"

function Login(){


    const url = useSelector((state:RootState) => {state.server.serverURL})
    const navigate = useNavigate();
    
    const [email, setemail] = useState<string>("");
    const [password, setpassword] = useState<string>("");
    const [error, setError] = useState("");


    const dispatch = useDispatch();

    function ValideteAllInputs():boolean{
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(email.length === 0){
            setError(error+"\nНевведено email")   
        }
        if(password.length === 0){
            setError(error+"\nНевведено пароль")
        }
        if(error.length !== 0){
            return false
        }
        else if(!emailPattern.test(email)){
            setError("Введіть коректний email!");
            return false
        }
        setError("")
        return true
    }
    return(    
        <div className="Login">
        <p>Email</p>
        <input type="text" name="email" onChange={(e)=>{setemail(e.target.value)}}/>
        <p>Password</p>
        <input type="password" name="password" onChange={(e)=>{setpassword(e.target.value)}}/>
        {error.length !== 0 && <p className="error">{error}</p>}
        <button onClick={async() => {
            if(ValideteAllInputs()){
                const auth = await axios({
                    method:"Get",
                    url:`http://localhost:3210/api/user/auth?email=${email}&password=${password}`,
                })
                console.log(auth)
                if(auth){
                    const user = await axios({
                        method:"get",
                        url: `http://localhost:3210/api/user/email?email=${email}`
                    })
                    if(user.data.avatar == null){
                        user.data.avatar =""
                    }
                    dispatch(changeName(user.data.nickname))   
                    dispatch(changeEmail(user.data.email))
                    dispatch(changeDescription(user.data.description))
                    dispatch(increaseBalance(user.data.mybalance))
                    dispatch(changeAvatar(user.data.avatar))
                    localStorage.setItem("email", email)
                    localStorage.setItem("password", password)
                    navigate("/User")
                }
            }
        } }>Submit</button>
    </div>)
}
export default Login;