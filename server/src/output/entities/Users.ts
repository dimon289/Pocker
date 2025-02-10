import {
  Column,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  OneToMany
} from "typeorm";
import { Balance } from "./Balance";
import { Players } from "./Players";

@Index("users_email_key", ["email"], { unique: true })
@Index("users_pkey", ["id"], { unique: true })
@Index("users_nickname_key", ["nickname"], { unique: true })
@Entity("users", { schema: "public" })
export class Users {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("text", { name: "email" })
  email: string;

  @Column("text", { name: "password" })
  password: string;

  @Column("numeric", {
    name: "mybalance",})
  mybalance: number;

  @Column("text", { name: "nickname" })
  nickname: string;

  @Column("text", { name: "avatar", nullable: true })
  avatar: string | null;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("int4", {
    name: "friends",
    nullable: true,
    array: true,
    default: () => "ARRAY[]::integer[]",
  })
  friends: number[] | null;

  @Column("int4", {
    name: "chatsid",
    nullable: true,
    array: true,
    default: () => "ARRAY[]::integer[]",
  })
  chatsid: number[] | null;


  @Column("boolean", { name: "status", nullable: true, default: () => "false" })
  status: boolean | null;

}
