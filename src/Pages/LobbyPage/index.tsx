import axios from "axios";
import Room from "./Room";
import { useEffect } from "react";


export default function Lobbys() {
    useEffect(() => {
        const getRooms = async() =>{
            const rooms = await axios({
                method: "get",
                url: `http://localhost:3210/api/room`
            })
        }
    })
    const data =  [
        {
            id : 1,
            name : "name",
            status : "online",
            usersid : ["1","2","3"],
        },
        {
            id : 2,
            name : "name2",
            status : "online",
            usersid : ["4","5","6"],
        },

    ]
    const somefunc = ()=>{
        console.log("ABOBA")
    }


    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full overflow-y-auto p-5 lobby">
            {data.map((i) => (
                <Room key={i.id} data={i} connectionFunction={somefunc} />
            ))}
        </div>
    );
}
