import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "User",
    initialState: {
        userId:"",
        userName:"",
        avatar: "",
        description:"",
        email:"",
        balance: 0,
    },
    reducers:{
        ChangeUserId(state, action){
            state.userId = action.payload
        },
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
export const {ChangeUserId, changeName, changeAvatar, changeDescription, changeEmail, increaseBalance, decreaseBalance} = userSlice.actions
export default userSlice.reducer
