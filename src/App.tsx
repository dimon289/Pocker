import './App.css'
import {RouterProvider, createBrowserRouter } from "react-router-dom"
import {
  HomePage,
  UserPage,
  RegisterPage,
  LoginPage,
  LobbyPage,
  CreateRoomPage
} from "./Pages"



const router = createBrowserRouter([
  {
    path:'/',
    element:<HomePage/>,
    children:[
      {
        path:"User",
        element:<UserPage/>
      },
      {
        path:"Lobbys",
        element:<LobbyPage/>
      },
      {
        path:"CreateRoom",
        element:<CreateRoomPage/>
      }
    ]
  },
  {path:"/Login",element:<LoginPage/>},
  {path:"/Register",element:<RegisterPage/>}
])

function App() {
  return <RouterProvider router={router}/>
}

export default App
