import {
  Column,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Players } from "./Players";
import { Pocker } from "./Pocker";

@Index("room_pkey", ["id"], { unique: true })
@Entity("room", { schema: "public" })
export class Room {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("text", { name: "name" })
  name: string;

  @Column("text", { name: "password", nullable: true })
  password: string | null;

  @Column("int4", { name: "usersid", nullable: true, array: true })
  usersid: number[] | null;

  @Column("enum", { name: "status", enum: ["Waiting", "Playing", "Full"] })
  status: "Waiting" | "Playing" | "Full";

  @OneToOne(() => Players, (players) => players.room)
  players: Players;

  @OneToOne(() => Pocker, (pocker) => pocker.room)
  pocker: Pocker;
}
