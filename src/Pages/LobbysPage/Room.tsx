import "./style.css";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../Store";
import  axios  from "axios";
import { io, Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";


interface RoomProps {
  data: {
    id: number;
    name: string;
    usersid: string[];
    status: string;
  };
}

const apiUrl = import.meta.env.VITE_API_URL;
const socket: Socket = io(`${apiUrl}/api/rooms`, { autoConnect: false, withCredentials: true});

export default function Room({ data }: RoomProps) {
  const navigate = useNavigate();

  const name = useSelector((state: RootState) => state.user.userName);

  const [isVisible, setIsVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Приєднання до WebSocket і прослуховування подій
  useEffect(() => {
    socket.on("joinRoomSuccess", (roomId: number) => {
      console.log("Успішно приєдналися до кімнати:", roomId);
      setErrorMessage("");
      // Перехід на сторінку кімнати
      navigate(`/RoomPage/${roomId}`);// або useNavigate, якщо хочеш
    });

    socket.on("joinRoomError", (error: { message: string }) => {
      setErrorMessage(error.message);
    });

    return () => {
      socket.off("joinRoomSuccess");
      socket.off("joinRoomError");
    };
  }, []);

  // Функція приєднання через WS
  const connectToLobby = async () => {
    try {
      // Авторизація — можна отримати userId з redux або localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Відсутній токен авторизації");
        return;
      }

      // Твоя логіка отримання userId — наприклад через axios, можна кешувати
      const { data: authData } = await axios.get(`${apiUrl}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data: userData } = await axios.get(`${apiUrl}/api/user/email`, {
        params: { email: authData.email },
      });
      const userId = userData.id;

      socket.auth = { token }; // можна передати токен для авторизації WS
      if (!socket.connected) {
        socket.connect();
      }

      socket.emit("joinRoom", {
        roomId: data.id,
        password,
        userId,
      });
    } catch (error) {
      console.error(error);
      setErrorMessage("Помилка під час приєднання");
    }
  };

  return (
    <div className="roomcell">
      {isVisible && (
        <div className="RoomPassword">
          <input
            type="password"
            placeholder="Введіть пароль кімнати"
            onChange={(e) => setPassword(e.target.value)}
          />
          <div>
            <button
              onClick={() => {
                localStorage.setItem("roomid", `${data.id}`);
                localStorage.setItem("roompassword", password);
                connectToLobby();
              }}
            >
              Підтвердити
            </button>
            <button
              onClick={() => {
                setIsVisible(false);
                setErrorMessage("");
              }}
            >
              Закрити
            </button>
          </div>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
      )}

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

      {name.length !== 0 && (
        <button className="connect" onClick={() => setIsVisible(true)}>
          Connect
        </button>
      )}
    </div>
  );
}
