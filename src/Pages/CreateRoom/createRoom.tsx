import { useState } from "react"


export default function createRoom(){
    const [roomName, setroomName] = useState<String>("")
    const [roomPassword, setroomPassword] = useState<string>("")
    const submitCreateRoom = async() =>{
        
    }
    return (
        <div className="createRoom">
            <p>Room Name</p>
            <input type="text"  onChange={(e)=>{setroomName(e.target.value)}}/>
            <p>Room Password</p>
            <input type="text" onChange={(e)=>{setroomPassword(e.target.value)}}/>
            <button onClick={submitCreateRoom}>Create Room</button>
        </div>
    )
}