import {Link, useNavigate} from "react-router-dom"
import { useState } from "react";
import { useSelector} from "react-redux";
import { RootState } from "../../Store";
import axios from 'axios';
import "./style.css"

function Register(){
    const navigate = useNavigate();
    const url = useSelector((state:RootState) => {state.server.serverURL})
    const [nickName, setNickName] = useState<string>("");
    const [email, setemail] = useState<string>("");
    const [password, setpassword] = useState<string>("");
    const [checkPassword, setcheckpassword] = useState<string>("");
    const [error, setError] = useState("");

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
        if(checkPassword.length === 0){
            setError(error+"\nНевведено пароль для перевірки")
        }
        if(error.length !== 0){
            return false
        }
        else if(!emailPattern.test(email)){
            setError("Введіть коректний email!");
            return false
        }
        else if(checkPassword !== password){
            setError("Паролі не співпадають")
            return false
        }
        setError("")
        return true
    }
    
    return(
    <div className="Registre">
        <p>NickName</p>
        <input type="text" name="nickName" onChange={(e)=>{setNickName(e.target.value)}}/>
        <p>Email</p>
        <input type="text" name="email" onChange={(e)=>{setemail(e.target.value)}}/>
        <p>Password</p>
        <input type="password" name="password" onChange={(e)=>{setpassword(e.target.value)}}/>
        <p>Confirm Password</p>
        <input type="password" name="checkPassword" onChange={(e)=>{setcheckpassword(e.target.value)}}/>
        {error.length !== 0 && <p className="error">{error}</p>}
        <button onClick={async() => {
            if (ValideteAllInputs()){
                const IsUniqueEmail = await axios({
                    method:"get",
                    url:`http://localhost:3210/api/user/email?email=${email}`,
                })
                const IsUniqueName = await axios({
                    method:"get",
                    url:`http://localhost:3210/api/user/name?name=${nickName}`,
                })
                if(!IsUniqueEmail){
                    setError("Ваш Email уже зареєстровано")
                }
                else if(!IsUniqueName){
                    setError("Ваш NickName уже зареєстровано")
                }
                else{
                    await axios({
                        method:"post",
                        url:`http://localhost:3210/api/user`,
                        data:{
                            "nickname" : nickName,
                            "email" : email,
                            "password" : password
                        }
                        
                    }).then((e) => {console.log("ABOBA " + e)
                        navigate("/");
                    })
                    .catch(() => {setError("Не вдалось зареєстуватись")})
                }
            }
        } }>Submit</button>
    </div>
)
}
export default Register;