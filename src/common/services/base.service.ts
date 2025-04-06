import { Logger } from '@nestjs/common';
import { BaseEntity } from '../entities/base.entity';
import { BaseRepository } from '../repositories/base.repository';
import { DeepPartial, FindOneOptions } from 'typeorm';

export abstract class BaseService<T extends BaseEntity> {
  protected readonly logger: Logger;

  constructor(
    private readonly repository: BaseRepository<T>,
    serviceName: string,
  ) {
    this.logger = new Logger(serviceName);
  }

  async create(data: DeepPartial<T>): Promise<T> {
    this.logger.debug(`Creating entity with data: ${JSON.stringify(data)}`);
    try {
      return await this.repository.create(data);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error creating entity: ${err.message}`, err.stack);
      throw err;
    }
  }

  async findOne(options: FindOneOptions<T>): Promise<T> {
    try {
      return await this.repository.findOne(options);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error finding entity: ${err.message}`, err.stack);
      throw err;
    }
  }

  async findOneById(id: string): Promise<T> {
    try {
      return await this.repository.findOneById(id);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error finding entity by id ${id}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  async findMany(options?: FindOneOptions<T>): Promise<T[]> {
    try {
      return await this.repository.findMany(options);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Error finding entities: ${err.message}`, err.stack);
      throw err;
    }
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    this.logger.debug(
      `Updating entity ${id} with data: ${JSON.stringify(data)}`,
    );
    try {
      return await this.repository.update(id, data);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error updating entity ${id}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  async delete(id: string): Promise<boolean> {
    this.logger.debug(`Deleting entity ${id}`);
    try {
      return await this.repository.delete(id);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Error deleting entity ${id}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  async executeInTransaction<R>(operation: () => Promise<R>): Promise<R> {
    try {
      return await this.repository.transaction(operation);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Transaction failed: ${err.message}`, err.stack);
      throw err;
    }
  }
}
