import { useState } from "react";
import "./style.css";
import axios from "axios";

function CreateRoom() {
    const [roomName, setRoomName] = useState("");
    const [roomPassword, setRoomPassword] = useState("");

    const submitCreateRoom = async () => {
        const user = axios({
            method:"get",
            
        })
    };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-md p-8 rounded-xl shadow-lg createRoomPage">
                <h2 className="text-2xl font-semibold text-white text-center mb-6">Create a Room</h2>

                <div className="mb-4">
                    <label className="block text-gray-300 mb-2">Room Name</label>
                    <input
                        type="text"
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-green-500 outline-none"
                        onChange={(e) => setRoomName(e.target.value)}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-300 mb-2">Room Password</label>
                    <input
                        type="password"
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-green-500 outline-none"
                        onChange={(e) => setRoomPassword(e.target.value)}
                    />
                </div>

                <button
                    onClick={submitCreateRoom}
                    className="w-full py-2 mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md transition-transform transform hover:scale-105 flex items-center justify-center "
                >
                    Create Room
                </button>
            </div>
        </div>
    );
}

export default CreateRoom;
