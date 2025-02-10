import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Room } from "./Room";
import { Users } from "./Users";
import { Step } from "./Step";

@Index("players_pkey", ["id"], { unique: true })
@Index("players_roomid_key", ["roomid"], { unique: true })
@Index("players_userid_key", ["userid"], { unique: true })
@Entity("players", { schema: "public" })
export class Players {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("integer", { name: "userid" })
  userid: number;

  @Column("char", { name: "cards", nullable: true, array: true })
  cards: string[] | null;

  @Column("integer", { name: "roomid" })
  roomid: number;

  @Column("boolean", { name: "status", default: () => "false" })
  status: boolean;

  @OneToOne(() => Room, (room) => room.players, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "roomid", referencedColumnName: "id" }])
  room: Room;

  @OneToOne(() => Users, (users) => users.id, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "userid", referencedColumnName: "id" }])
  user: Users;

  @OneToOne(() => Step, (step) => step.nextPlayer)
  step: Step;

  @OneToOne(() => Step, (step) => step.player)
  step2: Step;
}
