import "./style.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface RoomProps {
    data: {
        id: number;
        name: string;
        usersid: string[];
        status: string; 
    };
    connectionFunction: () => void; 
}
// function connectionFunction(){
    
// }
// const apiUrl = process.env.REACT_APP_API_URL;
export default function Room({data}: RoomProps) {
    const navigate = useNavigate();
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
                        navigate("/");
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
            <button className="connect" onClick={() => {setIsVisible(true)}}>Connect</button>
        </div>
    );
}
