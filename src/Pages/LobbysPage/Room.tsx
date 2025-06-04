import "./style.css";
import { useState } from "react";
// import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../Store";
import axios from "axios";

interface RoomProps {
    data: {
        id: number;
        name: string;
        usersid: string[];
        status: string; 
    };
}
const apiUrl = process.env.REACT_APP_API_URL;
export default function Room({data}: RoomProps) {
    const name = useSelector((state:RootState) => state.user.userName)
    const connectToLobby = async()=>{
        const roomsUsers = await axios({
            method: "get", 
            url: `${apiUrl}/rooms?${localStorage.getItem("roomid")}`
        }).then(response => {
            return response.data[0]?.usersid;
        });
        const userid = await axios({
            method: "get",
            url: `${apiUrl}/user/email?email=${localStorage.getItem("email")}`
        }).then(response => response.data.id)  
        await roomsUsers.push(userid) 
        await axios({
            method: "patch",
            url: `${apiUrl}/rooms/${localStorage.getItem("roomid")}`,
            params: {
                password: password.length !== 0 ? localStorage.getItem("roompassword") || password : undefined
            },
            data: {
                usersid: roomsUsers,
            }})
                .then(response => console.log(response.data))
                .catch(error => console.error(error));
    }
    // const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState<Boolean>(false) 
    const [password, setpassword] = useState<String>("")
    return (
        <div className="roomcell">
            
            {isVisible && (<div className="RoomPassword">
                <input type="password" onChange={(e) => {setpassword(e.target.value)}} />
                <div>
                    <button onClick={() => {
                        localStorage.setItem("roomid",`${data.id}`)
                        localStorage.setItem("roompassword",`${password}`)
                        connectToLobby()  
                    }}>Потдвердить</button>
                    <button onClick={() =>{
                        setIsVisible(false)
                    }} >Закрить</button>
                </div> 
            </div>)}
            
            <div className="room-id">Room ID: {data.id}</div>
            <div className="room-name">Name: {data.name}</div>
            <div className="room-status">Status: {data.status}</div>
            <div className="users-room-name">
                <div>Players:</div>
                <div>
                    {data.usersid.map((user, index) => (
                        <div key={index}>{user}</div>
                    ))}
                </div>
            </div>
            {name.length !== 0 && <button className="connect" onClick={() => {setIsVisible(true)}}>Connect</button>}
        </div>
    );
}
