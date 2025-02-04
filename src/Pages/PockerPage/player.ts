interface PlayerInterface{
    id: string;
    name : string;
    hand: string[];
    chips: number;
    your_bet: number;
    takeCards(cards: string[]):void;
    check(bet: number): void;
    call(): void;
    pass():void;
}

class Player implements PlayerInterface{
    id:string;
    name: string;
    chips: number;
    hand: string[] = [];
    your_bet: number;
    constructor(id:string,name:string,chips:number,your_bet: number){
        this.id = id;
        this.name = name;
        this.chips = chips;
        this.your_bet = 0;
    }
    takeCards(cards: string[]): void {
        if (this.hand?.length != 0){
            this.hand = [...this.hand, ...cards]
        }
    }
    check(bet:number): void {
        if bet >  this.your_bet{
            if (this.chips >= this.your_bet){
                
            }
        }
    }


}