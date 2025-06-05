import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from 'axios';
import "./style.css";
const apiUrl = process.env.REACT_APP_API_URL;
function Register() {
    const navigate = useNavigate();
    const [nickName, setNickName] = useState<string>("");
    const [email, setemail] = useState<string>("");
    const [password, setpassword] = useState<string>("");
    const [checkPassword, setcheckpassword] = useState<string>("");
    const [error, setError] = useState("");

    function ValideteAllInputs(): boolean {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (nickName.length === 0) {
            setError(error + "Невведено ім'я");
        }
        if (email.length === 0) {
            setError(error + "\nНевведено email");
        }
        if (password.length === 0) {
            setError(error + "\nНевведено пароль");
        }
        if (checkPassword.length === 0) {
            setError(error + "\nНевведено пароль для перевірки");
        }
        if (error.length !== 0) {
            return false;
        }
        else if (!emailPattern.test(email)) {
            setError("Введіть коректний email!");
            return false;
        }
        else if (checkPassword !== password) {
            setError("Паролі не співпадають");
            return false;
        }
        setError("");
        return true;
    }

    return (
<div className="Registre flex flex-col items-center bg-gray-800 p-6 rounded-md shadow-lg w-full sm:w-96">
    <h2 className="text-2xl font-semibold text-white mb-6 text-left">Реєстрація</h2>
    <p className="text-white mb-2 text-left">NickName</p>
    <input 
        type="text" 
        name="nickName" 
        onChange={(e) => { setNickName(e.target.value) }} 
        className="border-2 border-gray-400 p-2 w-full rounded-md mb-4"
        style={{ height: '30px', width: '100%' }} 
    />
    <p className="text-white mb-2 text-left">Email</p>
    <input 
        type="text" 
        name="email" 
        onChange={(e) => { setemail(e.target.value) }} 
        className="border-2 border-gray-400 p-2 w-full rounded-md mb-4"
        style={{ height: '30px', width: '100%' }} 
    />
    <p className="text-white mb-2 text-left">Password</p>
    <input 
        type="password" 
        name="password" 
        onChange={(e) => { setpassword(e.target.value) }} 
        className="border-2 border-gray-400 p-2 w-full rounded-md mb-4"
        style={{ height: '30px', width: '100%' }} 
    />
    <p className="text-white mb-2 text-left">Confirm Password</p>
    <input 
        type="password" 
        name="checkPassword" 
        onChange={(e) => { setcheckpassword(e.target.value) }} 
        className="border-2 border-gray-400 p-2 w-full rounded-md mb-4"
        style={{ height: '30px', width: '100%' }} 
    />
    {error.length !== 0 && <p className="error text-red-500 text-sm mb-4 text-left">{error}</p>}
    <button 
        onClick={async () => {
            console.log(`${apiUrl}/api/user`);
            if (ValideteAllInputs()) {
                const IsUniqueEmail = await axios({
                    method: "get",
                    url: `${apiUrl}/api/user/email?email=${email}`,
                });
                const IsUniqueName = await axios({
                    method: "get",
                    url: `${apiUrl}/api/user/name?name=${nickName}`,
                });
                if (!IsUniqueEmail) {
                    setError("Ваш Email вже зареєстровано");
                }
                else if (!IsUniqueName) {
                    setError("Ваш NickName вже зареєстровано");
                }
                else {
                    await axios({
                        method: "post",
                        url: `${apiUrl}/api/user`,
                        data: {
                            "nickname": nickName,
                            "email": email,
                            "password": password
                        }

                    }).then((e) => {
                        console.log("ABOBA " + e);
                        navigate("/");
                    })
                        .catch(() => { setError("Не вдалось зареєстуватись") });
                }
            }
        }} 
        className="w-full bg-blue-600 text-white font-bold py-2 rounded-md transition duration-300 hover:bg-blue-700 mt-4 flex items-center justify-center"
    >
        Submit
    </button>
</div>

    );
}

export default Register;
