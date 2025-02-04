import { Outlet } from "react-router-dom"
import { useSelector} from "react-redux";
import {RootState} from "../../Store"
import { Link } from "react-router-dom";
import "./style.css"

function home(){
    const name = useSelector((state:RootState) => state.user.userName);
    const balance = useSelector((state:RootState) => state.user.balance);
    
    return ( 
    <>
        {name.length !== 0?
        <header>    
            <div><Link to="User">{name}</Link></div>
            <div>{balance.toLocaleString('en-US',{style:"currency",currency:"USD"})}</div>
        </header>:
        <header>
            <div><Link to="/Register">Registre</Link></div>
            <div><Link to="/Login">LogIN</Link></div>
        </header>}
        <Outlet/>        
    </>
    )
}

export default home
