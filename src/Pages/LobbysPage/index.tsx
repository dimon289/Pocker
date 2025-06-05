import axios from "axios";
import Room from "./Room";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../Store";


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
    const name = useSelector((state:RootState) => state.user.userName)
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

    

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full overflow-y-auto p-5 lobby">
            {data.map((i) => (
                <Room key={i.id} data={i}/>
            ))}
            {name.length !== 0 && <button className="createRoom" onClick ={() => {navigate("/CreateRoom")}}>Create Room</button>}
        </div>
    );
}
