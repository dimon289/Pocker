import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Balance } from "./Balance";
import { Players } from "./Players";
import { Pocker } from "./Pocker";

@Index("step_pkey", ["id"], { unique: true })
@Index("step_next_playerid_key", ["nextPlayerid"], { unique: true })
@Index("step_playerid_key", ["playerid"], { unique: true })
@Index("step_pockerid_key", ["pockerid"], { unique: true })
@Entity("step", { schema: "public" })
export class Step {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("integer", { name: "pockerid" })
  pockerid: number;

  @Column("integer", { name: "playerid" })
  playerid: number;

  @Column("integer", { name: "bet", default: () => "0" })
  bet: number;

  @Column("integer", { name: "next_playerid" })
  nextPlayerid: number;

  @Column("numeric", {
    name: "maxbet",
    precision: 12,
    scale: 2,
    default: () => "0",
  })
  maxbet: string;

  @Column("enum", {
    name: "steptype",
    enum: ["Check", "Call", "Raise", "Fold", "Bet", "End"],
  })
  steptype: "Check" | "Call" | "Raise" | "Fold" | "Bet" | "End";

  @OneToOne(() => Balance, (balance) => balance.step)
  balance: Balance;

  @OneToOne(() => Players, (players) => players.step, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "next_playerid", referencedColumnName: "id" }])
  nextPlayer: Players;

  @OneToOne(() => Players, (players) => players.step2, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "playerid", referencedColumnName: "id" }])
  player: Players;

  @OneToOne(() => Pocker, (pocker) => pocker.step, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "pockerid", referencedColumnName: "id" }])
  pocker: Pocker;
}
