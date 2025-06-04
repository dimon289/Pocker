import {useNavigate} from "react-router-dom"
import { useState } from "react";
import { useDispatch} from "react-redux";
import {changeName, changeAvatar, changeDescription, changeEmail, increaseBalance} from "../../Slices/userSlice";

import axios from 'axios';
import "./style.css"
const apiUrl = process.env.REACT_APP_API_URL;
function Login(){

    
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

    const buttnfunc = async() =>{
        if(ValideteAllInputs()){
            const auth = await axios({
            method:"Get",
            url:`${apiUrl}/user/auth?email=${email}&password=${password}`,
        })
        console.log(auth)
        if(auth){
            const user = await axios({
                method:"get",
                url: `${apiUrl}/user/email?email=${email}`
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
        }

        return (
            <div className="flex flex-col items-center bg-gray-800 p-6 rounded-lg shadow-lg w-96 mx-auto mt-10 Login">
                <p className="text-white text-lg font-semibold w-full text-left">Email</p>
                <input
                    type="text"
                    name="email"
                    onChange={(e) => setemail(e.target.value)}
                    className="w-full p-3 mt-1 rounded-md border border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
        
                <p className="text-white text-lg font-semibold w-full text-left mt-4">Password</p>
                <input
                    type="password"
                    name="password"
                    onChange={(e) => setpassword(e.target.value)}
                    className="w-full p-3 mt-1 rounded-md border border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
        
                {error.length !== 0 && <p className="text-red-500 font-semibold mt-2">{error}</p>}
        
                <button
                    onClick={async () => buttnfunc()}
                    className="w-full bg-gray-500 text-white font-bold py-2 mt-4 rounded-md transition-all hover:bg-gray-600 hover:scale-105 flex items-center justify-center"
                >
                    Submit
                </button>
            </div>
        )}
export default Login;