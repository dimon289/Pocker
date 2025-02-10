import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  ManyToOne
} from "typeorm";
import { Step } from "./Step";
import { Users } from "./Users";

@Index("balance_pkey", ["id"], { unique: true })
@Index("balance_stepid_key", ["stepid"], { unique: true })
@Index("balance_userid_key", ["userid"], { unique: true })
@Entity("balance", { schema: "public" })
export class Balance {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("integer", { name: "stepid" })
  stepid: number;

  @Column("integer", { name: "userid" })
  userid: number;

  @Column("boolean", { name: "balancetype", default: () => "false" })
  balancetype: boolean;

  @Column("integer", { name: "bet", default: () => "0" })
  bet: number;

  @ManyToOne(() => Step, (step) => step.id, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "stepid", referencedColumnName: "id" }])
  step: Step;

  @OneToOne(() => Users, (users) => users.id, { onDelete: "CASCADE" })
  @JoinColumn([{ name: "userid", referencedColumnName: "id" }])
  user: Users;
}
