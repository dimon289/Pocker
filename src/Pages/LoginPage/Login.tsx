import {Link, useNavigate} from "react-router-dom"
import { useState } from "react";
import { useSelector, useDispatch} from "react-redux";
import { RootState } from "../../Store";
import axios from 'axios';
import "./style.css"

function Login(){
    const url = useSelector((state:RootState) => {state.server.serverURL})
    const navigate = useNavigate();
    const [nickName, setNickName] = useState<string>("");
    const [email, setemail] = useState<string>("");
    const [password, setpassword] = useState<string>("");
    const [error, setError] = useState("");


    const dispatch = useDispatch();

    const name = useSelector((state:RootState) => state.user.userName)
    const [redactName, setRedactName] = useState<boolean>(false)
    const [inputName, setinputName] = useState<string>("");


    const description = useSelector((state:RootState) => state.user.description)
    const [redactDescription, setRedactDescription] = useState<boolean>(false)
    const [inputDescription, setinputDescription] = useState<string>("");

    const balance = useSelector((state:RootState) => state.user.balance)


    const imageURL = useSelector((state:RootState) => state.user.avatar)
    const [inputURL, setinputURL] = useState<string>("");
    const [isVisibleInputIMGForm, setisVisibleInputIMGForm] = useState(false);

    function ValideteAllInputs():boolean{
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(nickName.length === 0){
            setError(error+"Невведено ім'я")             
        }
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
            if (ValideteAllInputs()){
                await axios({
                    method:"post",
                    url:`http://localhost:3210/api/user`,
                    data:{
                        "nickname" : nickName,
                        "email" : email,
                        "password" : password
                    }
                    
                }).then((e) => {console.log("ABOBA " + e)
                    navigate("/User");
                })
                .catch(() => {setError("Не вдалось зареєстуватись")})
            }
        } }>Submit</button>
    </div>)
}
export default Login;