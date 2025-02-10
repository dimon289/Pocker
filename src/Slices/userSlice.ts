import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "User",
    initialState: {
        userName:"",
        avatar: "",
        description:"",
        email:"",
        balance: 0,
    },
    reducers:{
        changeName(state, action){
            state.userName = action.payload
        },
        changeAvatar(state, action){
            state.avatar = action.payload
        },
        changeDescription(state, action){
            state.description = action.payload
        },
        changeEmail(state, action){
            state.email = action.payload
        },
        increaseBalance(state, action){
            state.balance += action.payload 
        },
        decreaseBalance(state, action){
            state.balance -= action.payload 
        },
    }
})
export const {changeName, changeAvatar, changeDescription, changeEmail, increaseBalance, decreaseBalance} = userSlice.actions
export default userSlice.reducer
