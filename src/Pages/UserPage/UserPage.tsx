import {Link} from "react-router-dom"
import { useState } from "react";
import { useSelector , useDispatch } from "react-redux";
import { changeName, changeAvatar, changeDescription, increaseBalance } from "../../User/userSlice";
import { RootState } from "../../Store";
import "./style.css"


function User(){
    const dispatch = useDispatch();

    const name = useSelector((state:RootState) => state.user.userName)
    const [redactName, setRedactName] = useState<boolean>(false)
    const [inputName, setinputName] = useState<string>("");


    const description = useSelector((state:RootState) => state.user.description)
    const [redactDescription, setRedactDescription] = useState<boolean>(false)
    const [inputDescription, setinputDescription] = useState<string>("");

    const balance = useSelector((state:RootState) => state.user.balance)


    const imageURL = useSelector((state:RootState) => state.user.avatar)
    const [inputURL, setinputURL] = useState<string>("");
    const [isVisibleInputIMGForm, setisVisibleInputIMGForm] = useState(false);

    const toggleFormVisibility = () => {
        setisVisibleInputIMGForm(prevState => !prevState);
    };
    const handleChangeImage = () => {
        dispatch(changeAvatar(inputURL)); 
    };
    return(     
    <div className="userPage">
        {isVisibleInputIMGForm && (
            <div className={`formInput ${isVisibleInputIMGForm ? "visible":""}`}>
                <input type="text"  onChange={(e) => {setinputURL(e.target.value)}}/>
                <button onClick= {()=>{
                    if( inputURL.length !== 0){
                        dispatch(changeAvatar(inputURL))
                    }}}>changeAvatar</button>
                <button onClick={toggleFormVisibility}>Close form</button>
            </div>
        )}
        <div className="imageBox">
            <img src={imageURL} />
            <button onClick={toggleFormVisibility}>Change image</button>
        </div>
        <div className="infoBox">
            {!redactName ? 
            (<div className="name">
                <h1>{name}</h1>
                <button onClick={() => {
                    setRedactName(prevState => !prevState)
                }}>change Name</button>
            </div>):
            (<div className="name">
                <input onChange={(e) => setinputName(e.target.value)}/>
                <button onClick={() => {
                    setRedactName(prevState => !prevState)
                    dispatch(changeName(inputName))
                }}>Submit</button>
            </div>)}
                
            {!redactDescription ? 
            (<div className="description">
                <h2>{description}</h2>
                <button onClick={() => {
                    setRedactDescription(prevState => !prevState)
                }}>change Description</button>
            </div>):
            (<div className="description">
                <textarea onChange={(e) => setinputDescription(e.target.value)}/>
                <button onClick={() => {
                    setRedactDescription(prevState => !prevState)
                    dispatch(changeDescription(inputDescription))
                }}>Submit</button>
            </div>)}
        </div>  
    </div>
)}
export default User;