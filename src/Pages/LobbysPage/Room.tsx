import "./style.css";
import { useState , useEffect, useRef,} from "react";
// import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../Store";
import axios from "axios";
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

interface RoomProps {
    data: {
        id: number;
        name: string;
        usersid: string[];
        status: string; 
    };
}
type ServerToClientEvents = {
  userJoined: (data: { userId: string }) => void;
};

type ClientToServerEvents = {
  joinRoom: (data: { roomId: string; userId: string }) => void;
};

export const RoomPage = () => {
  const { roomId } = useParams();
  const [users, setUsers] = useState<string[]>([]);

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    const socket = io(`${apiUrl}`);

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');

      // Надіслати joinRoom
      socket.emit('joinRoom', {
        roomId: roomId!,
        userId,
      });
    });

    socket.on('userJoined', ({ userId }) => {
      console.log(`${userId} joined the room`);
      setUsers(prev => [...prev, userId]);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  return (
    <div>
      <h2>Room ID: {roomId}</h2>
      <h3>Users in room:</h3>
      <ul>
        {users.map((id, index) => (
          <li key={index}>{id}</li>
        ))}
      </ul>
    </div>
  );
};
const apiUrl = import.meta.env.VITE_API_URL;
export default function Room({data}: RoomProps) {
    const name = useSelector((state:RootState) => state.user.userName)
    const connectToLobby = async()=>{
        const roomsUsers = await axios({
            method: "get", 
            url: `${apiUrl}/rooms?${localStorage.getItem("roomid")}`
        }).then(response => {
            return response.data[0]?.usersid;
        });

        const token = localStorage.getItem("token")
        const auth = await axios({
                        method: "get",
                        url: `${apiUrl}/api/user/profile`,
                        headers:{
                            'Authorization':`Bearer ${token}`
                        }
        })
        const userid = await axios({
            method: "get",
            url: `${apiUrl}/user/email?email=${auth.data.email}`
        }).then(response => response.data.id)  
        await roomsUsers.push(userid) 
        
        await axios({
            method: "patch",
            url: `${apiUrl}/rooms/${localStorage.getItem("roomid")}`,
            params: {
                password: password.length !== 0 ? localStorage.getItem("roompassword") || password : ""
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
