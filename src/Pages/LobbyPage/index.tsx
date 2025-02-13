import axios from "axios";
import Room from "./Room";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";


export default function Lobbys() {
    const navigate = useNavigate();
    useEffect(() => {
        const getRooms = async() =>{
            const rooms = await axios({
                method: "get",
                url: `http://localhost:3210/api/room`
            })
            console.log(rooms)
        }
        getRooms()
    })
    const somefunc = ()=>{
        console.log("ABOBA")
    }
    const data = []

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full overflow-y-auto p-5 lobby">
            {data.map((i) => (
                <Room key={i.id} data={i} connectionFunction={somefunc} />
            ))}
            <button className="createRoom" onClick ={() => {navigate("/CreateRoom")}}>Create Room</button>
        </div>
    );
}
