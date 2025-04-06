import {
  Repository,
  DeepPartial,
  FindOptionsWhere,
  FindOneOptions,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { BaseEntity } from '../entities/base.entity';
import { NotFoundException } from '@nestjs/common';

export abstract class BaseRepository<T extends BaseEntity> {
  constructor(private readonly repository: Repository<T>) {}

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findOne(options: FindOneOptions<T>): Promise<T> {
    const entity = await this.repository.findOne(options);
    if (!entity) {
      throw new NotFoundException();
    }
    return entity;
  }

  async findOneById(id: string): Promise<T> {
    const entity = await this.repository.findOneBy({
      id,
    } as FindOptionsWhere<T>);
    if (!entity) {
      throw new NotFoundException();
    }
    return entity;
  }

  async findMany(options?: FindOneOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    await this.repository.update(id, data as QueryDeepPartialEntity<T>);
    return this.findOneById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async createMany(data: DeepPartial<T>[]): Promise<T[]> {
    const entities = this.repository.create(data);
    return this.repository.save(entities);
  }

  async updateMany(
    criteria: FindOptionsWhere<T>,
    data: DeepPartial<T>,
  ): Promise<boolean> {
    const result = await this.repository.update(
      criteria,
      data as QueryDeepPartialEntity<T>,
    );
    return result.affected ? result.affected > 0 : false;
  }

  async transaction<R>(operation: () => Promise<R>): Promise<R> {
    const queryRunner = this.repository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation();
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
