import mongoose, { Model } from "mongoose";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";

type FilterQuery = Record<string, unknown>;

export interface FindManyOptions {
  filter?: FilterQuery;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  populate?: string | string[];
  select?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class BaseRepository<T = any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly model: Model<any>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(model: Model<any>) {
    this.model = model;
  }

  async findById(id: string | mongoose.Types.ObjectId, populate?: string | string[]): Promise<T | null> {
    const query = this.model.findById(id);
    if (populate) query.populate(populate);
    return query.lean().exec() as Promise<T | null>;
  }

  async findOne(filter: FilterQuery, populate?: string | string[]): Promise<T | null> {
    const query = this.model.findOne(filter);
    if (populate) query.populate(populate);
    return query.lean().exec() as Promise<T | null>;
  }

  async findMany(options: FindManyOptions = {}): Promise<PaginatedResult<T>> {
    const {
      filter = {},
      page = DEFAULT_PAGE,
      pageSize = DEFAULT_PAGE_SIZE,
      sortBy = "createdAt",
      sortOrder = "desc",
      populate,
      select,
    } = options;

    const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE);
    const skip = (page - 1) * safePageSize;

    const [data, totalItems] = await Promise.all([
      this.model
        .find(filter)
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(safePageSize)
        .select(select || "")
        .populate(populate || "")
        .lean()
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      data: data as T[],
      pagination: {
        page,
        pageSize: safePageSize,
        totalPages: Math.ceil(totalItems / safePageSize),
        totalItems,
      },
    };
  }

  async findAll(filter?: FilterQuery, populate?: string | string[]): Promise<T[]> {
    const query = this.model.find(filter || {});
    if (populate) query.populate(populate);
    return query.lean().exec() as Promise<T[]>;
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = await this.model.create(data);
    return doc.toObject() as T;
  }

  async update(id: string | mongoose.Types.ObjectId, data: Partial<T>): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec() as Promise<T | null>;
  }

  async delete(id: string | mongoose.Types.ObjectId): Promise<T | null> {
    return this.model.findByIdAndDelete(id).lean().exec() as Promise<T | null>;
  }

  async count(filter?: FilterQuery): Promise<number> {
    return this.model.countDocuments(filter || {}).exec();
  }

  async exists(filter: FilterQuery): Promise<boolean> {
    const doc = await this.model.findOne(filter).select("_id").lean().exec();
    return doc !== null;
  }
}
