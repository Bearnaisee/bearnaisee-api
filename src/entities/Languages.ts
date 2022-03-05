import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Recipes } from "./Recipes";

@Index("languages_pkey", ["id"], { unique: true })
@Index("languages_iso_code_key", ["isoCode"], { unique: true })
@Entity("languages", { schema: "public" })
export class Languages {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("character varying", { name: "iso_code", unique: true, length: 2 })
  isoCode: string;

  @OneToMany(() => Recipes, (recipes) => recipes.language)
  recipes: Recipes[];
}
