import {Link, useNavigate} from "react-router-dom"
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

    // const imageURL = useSelector(' ')
    const [inputURL, setinputURL] = useState<string>("");

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
                        user.data.avatar ="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAgVBMVEWBgob///+BgoR7fH56eX7S09TX1tt/g4Z/gIR/god7fIB4eX1/gIL8/PyCgYb9//7Z2dmwsLD29vapqq3v8PGhoaHo6OjJysu8vr51dniMi5CdnKF3dXu5ubn19PeYmJuHiYfl5OmSlJfQztO2trWXlZusqq+rrau6uL3q6uqNj49MhBOMAAAFDklEQVR4nO3dW3ubIAAGYIU4qYAxJtZDmmZN07Xr//+Bgx7Wbkkalcihz/febBe74BvIQcBEEQAAAAAAAAAAAAAAAAAAAAAAAAAAAEzk6p3rgkwmfee6IFNhLHvFXJdkCozzaLts6iRJ6maxjfg3ikkiwni0TFYy/mSVLCMuCHFdOnOEENFWxT/p3siiaqnr8pkjlC5WR+LphKomF1TVY9AVKfjjiXzvrXWp2qrrUhrIuuLLfHE8j4ufoTZV1cPwpdQZzkSUj22QDVX1MLQ+U4Hv6pbkuesCD0aEKOJjXegB9Y8KEWBCIa571qB2nYWXkA8JGMd3M9cFHoi05zrR/xU8qN6GtHW/Z/CTmrsu9RC0GhhPqzLXxe6PEXlmFDxiXgY0KvJkPiLhvKChRBTbcxOZowlVOxWui95TO2yg+HDdui56P2xMN/OqCmPhP7oKVSWGMWLsBg+FH3beV2Kakt4rimNq79eKOmFpkLD0fsBIU7EzCBjHW98HDJWwMUrY+J/QoCfVCt8fRJWwHN+TKqXvg75qpQZjheZ7T3OVbo3yqa7G8xExTZdG+ebx0veEYm9YhwvP18Ep2xgm3Hhfh9894VVq2kr33ic062nUc+h5wjQdv/zV5t4vgq/SZ8M69H2FmKbUcE7j+ypfzUu/3vM9Z+V/QpoYJUz8TygWRgl970pfGCV0XfgeGL8zCHjneyPVMpN521MIjTRicvx44brs/WRje1MZJ54vnd6wLj57iuaELohGGkW0jkfsHyr3oRxXEESO2AOWUuaBVGFE6H5EK5XxPpxDNYSOeS18R0M6GNUN3Z6R8a3rMg+TrQdX4TqUh/BNNmwCLr1/i3iA0GF7UI3vOzKHCB0yP914vzN6iBC60K3v/NivZrHLEJYUB0iUbcu4z+ymXIf2DP7FSBHPv15o6APCJLBe9DPSPp4bGMtFG94j+BkV9alK1M1X1iQL6EjicZw0t6fqr/kZ7BP4maD82MUnWVSU+n7yojfG+bop/t5ek6uiWWc89CtP/8jzPLuZ5d3Der1+6PKZ+ntA64h+ch2JvVB/ui4NAAAAwCE1X8nZ7KKyTM2B/JnYsdlN96u5/3E5982vTs1dXQfT9FchaJWY3EA4RSaVD19cIJRuzE7QfKXcCOevGdvH1cjd0B70lzMe3R5tZ2zohebhCsbcrSWz3a3hKbY+bjtn+4p0Ky0EVI1162hTQ2zluO364RF3Tt5YsWjEZv3YiA46VKJ3sm000VfXNEotf+Vt6P6gqYbbTii66YbBozphOSFPLCdMuN2ErLP4EMb6OFHc2U04s/sUarXdGerNqe2k6Vi+e/lgt5G+2NkMmD1ZzxfHG5sTG/7DQcLC5oEN/ttBwt9WE07x1uKc0uYKQ9jvZyxPv4mLhFYvsrupQ5s7x0bfLxmrRF960YTTv2I7IK2Oh8Z30sfYWD0/ZfaZnXHs3hCe2V9b3N7YDBhl9teHjd1DfnlnPWFn991+zs0uNA+X2N1NVP+dlitRdjbzvbD8JFp+CrXc6EbzUG5uQBOzr3oNIEsX+dTE5tlSQulo70lvkEorL76lu+9/Zc/THVL4sHJ5/1l/O39qhXB3oF8NwYRX027lryqXV2r0JCPPZ0/TzcJXe+r+13byiPEqmeJ5LJMqo87zvRKUPlcvv+V0KXVTPft2o4Zl9FK8/l0vcgmuQ3zp+ycEAAAAAAAAAAAAAAAAAAAAAAAAAADw3B+b+VIEWa5YQgAAAABJRU5ErkJggg=="
                    }
                    console.log(user, " " , user.data.nickname)
                    dispatch(
                        changeName(user.data.nickname),

                        changeAvatar(user.data.avatar)
                    )
                    dispatch(changeEmail(user.data.email))
                    dispatch(changeDescription(user.data.description))
                    dispatch(increaseBalance(user.data.mybalance))
                    navigate("/User")
                }
            }
        } }>Submit</button>
    </div>)
}
export default Login;