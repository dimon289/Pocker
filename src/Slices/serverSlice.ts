import { createSlice } from "@reduxjs/toolkit";

const serverSlice = createSlice({
    name: "Server",
    initialState: {
        serverURL:"localhost:3210"
    },
    reducers:{}
})


export default serverSlice.reducer