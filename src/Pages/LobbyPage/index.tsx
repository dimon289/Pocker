import axios from "axios";
import Room from "./Room";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface RoomType {
    id: number;
    name: string;
    status: string;
    usersid: string[];
}

export default function Lobbys() {
    const [data, setData] = useState<RoomType[]>([]);
    const navigate = useNavigate();
    useEffect(() => {
        const getRooms = async() =>{
            const rooms = await axios({
                method: "get",
                url: `http://localhost:3210/api/rooms`
            })
            setData(rooms.data)
        }
        getRooms()
    },[])
    const somefunc = ()=>{
        console.log("ABOBA")
    }
    

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full overflow-y-auto p-5 lobby">
            {data.map((i) => (
                <Room key={i.id} data={i} connectionFunction={somefunc} />
            ))}
            <button className="createRoom" onClick ={() => {navigate("/CreateRoom")}}>Create Room</button>
        </div>
    );
}
