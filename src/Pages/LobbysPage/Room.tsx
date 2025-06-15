import "./style.css";
import { useState} from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../Store";
import { useNavigate } from "react-router-dom";


interface RoomProps {
  data: {
    id: number;
    name: string;
    usersid: string[];
    status: string;
  };
}
export default function Room({ data }: RoomProps) {
  const navigate = useNavigate();
  const name = useSelector((state: RootState) => state.user.userName);
  const [isVisible, setIsVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");


  return (
    <div className="roomcell">
      {isVisible && (
        <div className="RoomPassword">
          <div>
            <button
              onClick={() => {


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
        <button className="connect" onClick={() => {
                localStorage.setItem("roomid", `${data.id}`);
                navigate(`/RoomPage/${data.id}`)
        }
        }>
          Connect
        </button>
      )}
    </div>
  );
}
