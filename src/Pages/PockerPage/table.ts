import { type Cards } from "./cards";

interface TableInterface{
    id:number;
    tableCards: Cards[];
    tableChips:number;
    minBet:number;
    previousUser:string; 
}