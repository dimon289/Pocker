import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Room } from "./Room";
import { Step } from "./Step";

@Index("pocker_pkey", ["id"], { unique: true })
@Index("pocker_roomid_key", ["roomid"], { unique: true })
@Entity("pocker", { schema: "public" })
export class Pocker {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("integer", { name: "roomid" })
  roomid: number;

  @Column("int4", { name: "playersid", nullable: true, array: true })
  playersid: number[] | null;

  @Column("char", { name: "cards", nullable: true, array: true })
  cards: string[] | null;

  @Column("integer", { name: "bank", default: () => "0" })
  bank: number;

  @OneToOne(() => Room, (room) => room.pocker, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "roomid", referencedColumnName: "id" }])
  room: Room;

  @OneToOne(() => Step, (step) => step.pocker)
  step: Step;
}
