import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./Users";

@Index("user_roles_pkey", ["id"], { unique: true })
@Index("user_roles_role_key", ["role"], { unique: true })
@Entity("user_roles", { schema: "public" })
export class UserRoles {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("character varying", { name: "role", unique: true, length: 20 })
  role: string;

  @OneToMany(() => Users, (users) => users.role)
  users: Users[];
}
