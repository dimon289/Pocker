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
const apiUrl = process.env.REACT_APP_API_URL;
export default function Lobbys() {
    const [data, setData] = useState<RoomType[]>([]);
    const navigate = useNavigate();
    useEffect(() => {
        const getRooms = async() =>{
            const rooms = await axios({
                method: "get",
                url: `${apiUrl}/api/rooms`
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
