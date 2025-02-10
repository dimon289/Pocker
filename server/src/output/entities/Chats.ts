import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("chats_pkey", ["id"], { unique: true })
@Entity("chats", { schema: "public" })
export class Chats {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("int4", { name: "usersid", nullable: true, array: true })
  usersid: number[] | null;

  @Column("jsonb", { name: "messages", nullable: true, default: [] })
  messages: object | null;
}
