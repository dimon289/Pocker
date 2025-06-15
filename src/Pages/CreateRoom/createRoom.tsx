import { useState} from "react";
import "./style.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL;

function CreateRoom() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [errmessage, setErrmessage] = useState("");

  const submitCreateRoom = async () => {
    try {
      if (roomName.trim().length === 0) {
        setErrmessage("Ви не ввели назву кімнати");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setErrmessage("Відсутній токен авторизації");
        return;
      }

      // Отримуємо профіль користувача
      const auth = await axios.get(`${apiUrl}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = await axios.get(`${apiUrl}/api/user/email`, {
        params: { email: auth.data.email },
      });
      const userid = user.data.id;

      // Створюємо кімнату через API
      const response = await axios.post(
        `${apiUrl}/api/rooms/create`,
        {
          name: roomName,
          userID: userid,
          password: roomPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const createdRoomId = response.data.roomid;
      localStorage.setItem("roomid", createdRoomId);
      navigate(`/RoomPage/${response.data.roomId}`)

    } catch (error) {
      console.error("Помилка створення кімнати:", error);
      setErrmessage("Сталася помилка при створенні кімнати");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-xl shadow-lg createRoomPage">
        <h2 className="text-2xl font-semibold text-white text-center mb-6">
          Create a Room
        </h2>

        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Room Name</label>
          <input
            type="text"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-green-500 outline-none"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Room Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-green-500 outline-none"
            value={roomPassword}
            onChange={(e) => setRoomPassword(e.target.value)}
          />
        </div>

        {errmessage && (
          <p className="text-red-500 mb-4 font-semibold">{errmessage}</p>
        )}

        <button
          onClick={submitCreateRoom}
          className="w-full py-2 mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md transition-transform transform hover:scale-105 flex items-center justify-center"
        >
          Create Room
        </button>
      </div>
    </div>
  );
}

export default CreateRoom;
