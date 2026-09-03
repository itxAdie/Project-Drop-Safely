import { BaseRepository } from "./base.repository";
import { City } from "@/lib/db/models";
import type { ICity } from "@/types";

export class CityRepository extends BaseRepository<ICity> {
  constructor() {
    super(City);
  }

  async findActive(): Promise<ICity[]> {
    return this.model
      .find({ isActive: true })
      .sort({ name: 1 })
      .lean()
      .exec() as unknown as ICity[];
  }

  async findByName(name: string): Promise<ICity | null> {
    return this.model
      .findOne({ name: new RegExp(`^${name}$`, "i") })
      .lean()
      .exec() as unknown as ICity | null;
  }
}
