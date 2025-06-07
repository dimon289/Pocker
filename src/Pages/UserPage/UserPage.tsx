import {Link, useNavigate} from "react-router-dom"
import { useState} from "react";
import { useSelector , useDispatch } from "react-redux";
import { changeName, changeAvatar, changeDescription} from "../../Slices/userSlice";
import { RootState } from "../../Store";
import "./style.css";
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;
function User(){
    const navigate = useNavigate();

    const dispatch = useDispatch();

    const name = useSelector((state:RootState) => state.user.userName)
    const [redactName, setRedactName] = useState<boolean>(false)
    const [inputName, setinputName] = useState<string>("");


    const description = useSelector((state:RootState) => state.user.description)
    const [redactDescription, setRedactDescription] = useState<boolean>(false)
    const [inputDescription, setinputDescription] = useState<string>("");

    // const balance = useSelector((state:RootState) => state.user.balance)


    const imageURL = useSelector((state:RootState) => state.user.avatar)
    const [inputURL, setinputURL] = useState<string>("");
    const [isVisibleInputIMGForm, setisVisibleInputIMGForm] = useState(false);

    const toggleFormVisibility = () => {
        setisVisibleInputIMGForm(prevState => !prevState);
    };

    return(     
    <div className="userPage">
        {isVisibleInputIMGForm && (
            <div className={`formInput ${isVisibleInputIMGForm ? "visible":""}`}>
                <input type="text"  onChange={(e) => {setinputURL(e.target.value)}}/>
                <button onClick= {async()=>{
                    if( inputURL.length !== 0){
                        dispatch(changeAvatar(inputURL))
                        await axios({
                            method:"patch",
                            url:`${apiUrl}/api/user?email=${localStorage.getItem("email")}`,
                            data:{
                                "avatar": inputURL,
                            }
                        })
                    }}}>changeAvatar</button>
                <button onClick={toggleFormVisibility}>Close form</button>
            </div>
        )}

        <div className="imageBox">
            {imageURL.length == 0?
            (
            <img src={"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAgVBMVEWBgob///+BgoR7fH56eX7S09TX1tt/g4Z/gIR/god7fIB4eX1/gIL8/PyCgYb9//7Z2dmwsLD29vapqq3v8PGhoaHo6OjJysu8vr51dniMi5CdnKF3dXu5ubn19PeYmJuHiYfl5OmSlJfQztO2trWXlZusqq+rrau6uL3q6uqNj49MhBOMAAAFDklEQVR4nO3dW3ubIAAGYIU4qYAxJtZDmmZN07Xr//+Bgx7Wbkkalcihz/febBe74BvIQcBEEQAAAAAAAAAAAAAAAAAAAAAAAAAAAEzk6p3rgkwmfee6IFNhLHvFXJdkCozzaLts6iRJ6maxjfg3ikkiwni0TFYy/mSVLCMuCHFdOnOEENFWxT/p3siiaqnr8pkjlC5WR+LphKomF1TVY9AVKfjjiXzvrXWp2qrrUhrIuuLLfHE8j4ufoTZV1cPwpdQZzkSUj22QDVX1MLQ+U4Hv6pbkuesCD0aEKOJjXegB9Y8KEWBCIa571qB2nYWXkA8JGMd3M9cFHoi05zrR/xU8qN6GtHW/Z/CTmrsu9RC0GhhPqzLXxe6PEXlmFDxiXgY0KvJkPiLhvKChRBTbcxOZowlVOxWui95TO2yg+HDdui56P2xMN/OqCmPhP7oKVSWGMWLsBg+FH3beV2Kakt4rimNq79eKOmFpkLD0fsBIU7EzCBjHW98HDJWwMUrY+J/QoCfVCt8fRJWwHN+TKqXvg75qpQZjheZ7T3OVbo3yqa7G8xExTZdG+ebx0veEYm9YhwvP18Ep2xgm3Hhfh9894VVq2kr33ic062nUc+h5wjQdv/zV5t4vgq/SZ8M69H2FmKbUcE7j+ypfzUu/3vM9Z+V/QpoYJUz8TygWRgl970pfGCV0XfgeGL8zCHjneyPVMpN521MIjTRicvx44brs/WRje1MZJ54vnd6wLj57iuaELohGGkW0jkfsHyr3oRxXEESO2AOWUuaBVGFE6H5EK5XxPpxDNYSOeS18R0M6GNUN3Z6R8a3rMg+TrQdX4TqUh/BNNmwCLr1/i3iA0GF7UI3vOzKHCB0yP914vzN6iBC60K3v/NivZrHLEJYUB0iUbcu4z+ymXIf2DP7FSBHPv15o6APCJLBe9DPSPp4bGMtFG94j+BkV9alK1M1X1iQL6EjicZw0t6fqr/kZ7BP4maD82MUnWVSU+n7yojfG+bop/t5ek6uiWWc89CtP/8jzPLuZ5d3Der1+6PKZ+ntA64h+ch2JvVB/ui4NAAAAwCE1X8nZ7KKyTM2B/JnYsdlN96u5/3E5982vTs1dXQfT9FchaJWY3EA4RSaVD19cIJRuzE7QfKXcCOevGdvH1cjd0B70lzMe3R5tZ2zohebhCsbcrSWz3a3hKbY+bjtn+4p0Ky0EVI1162hTQ2zluO364RF3Tt5YsWjEZv3YiA46VKJ3sm000VfXNEotf+Vt6P6gqYbbTii66YbBozphOSFPLCdMuN2ErLP4EMb6OFHc2U04s/sUarXdGerNqe2k6Vi+e/lgt5G+2NkMmD1ZzxfHG5sTG/7DQcLC5oEN/ttBwt9WE07x1uKc0uYKQ9jvZyxPv4mLhFYvsrupQ5s7x0bfLxmrRF960YTTv2I7IK2Oh8Z30sfYWD0/ZfaZnXHs3hCe2V9b3N7YDBhl9teHjd1DfnlnPWFn991+zs0uNA+X2N1NVP+dlitRdjbzvbD8JFp+CrXc6EbzUG5uQBOzr3oNIEsX+dTE5tlSQulo70lvkEorL76lu+9/Zc/THVL4sHJ5/1l/O39qhXB3oF8NwYRX027lryqXV2r0JCPPZ0/TzcJXe+r+13byiPEqmeJ5LJMqo87zvRKUPlcvv+V0KXVTPft2o4Zl9FK8/l0vcgmuQ3zp+ycEAAAAAAAAAAAAAAAAAAAAAAAAAADw3B+b+VIEWa5YQgAAAABJRU5ErkJggg=="}/>
            ):(<img src={imageURL} />)}

            <button onClick={toggleFormVisibility}>Change image</button>
        </div>

        <div className="infoBox">
            {!redactName ? 
            (<div className="name">
                <h1>{name}</h1>
                <button onClick={() => {
                    setRedactName(prevState => !prevState)
                }}>change Name</button>
            </div>):
            (<div className="name">
                <input onChange={(e) => setinputName(e.target.value)}/>
                <button onClick={async() => {
                    setRedactName(prevState => !prevState)
                    dispatch(changeName(inputName))
                    await axios({
                        method:"patch",
                        url:`${apiUrl}/api/user?email=${localStorage.getItem("email")}`,
                        data:{
                            "nickname": inputName,
                        }
                    })
                }}>Submit</button>
            </div>)}
                
            {!redactDescription ? 
            (<div className="description">
                <h2>{description}</h2>
                <button onClick={() => {
                    setRedactDescription(prevState => !prevState)
                }}>change Description</button>
            </div>):

            (<div className="description">
                <textarea onChange={(e) => setinputDescription(e.target.value)}/>
                <button onClick={async() => {
                    dispatch(changeDescription(inputDescription))
                    setRedactDescription(prevState => !prevState)
                    await axios({
                        method:"patch",
                        url:`${apiUrl}/api/user?email=${localStorage.getItem("email")}`,
                        data:{
                            "description": inputDescription,
                        }
                    })
                }}>Submit</button>
            </div>)}
        </div>  

        <div className="LogOutandDelete">
            <Link to={"/"}>
                <button onClick={()=>
                {dispatch(changeName(""))
                    localStorage.removeItem("email")
                    localStorage.removeItem("password")
                }}>Log out</button>
            </Link>
            <button className="delete" onClick={()=>
                {dispatch(changeName(""))
                axios({
                    method:"Delete",
                    url:`${apiUrl}/api/user?email=${localStorage.getItem("email")}&password=${localStorage.getItem("password")}`,
                }).then((e) => {console.log("ABOBA " + e)
                    localStorage.removeItem("email")
                    localStorage.removeItem("password")
                    navigate("/");
                })
                }}>Delete account</button>
        </div>
    </div>
)}
export default User;