import randomize from 'randomatic';
import { DacheModel, Item } from '../models/dache.model';

export enum DacheSearchMsg {
  Miss = 'Cache miss',
  Hit = 'Cache hit'
}

export class DacheController {
  constructor(private dacheModel: DacheModel) {
  }

  getAll() {
    return this.dacheModel.getCollection().find(
      {}, { projection: { _id: 0 } }
    );
  }

  async save({ key }: Pick<Item, 'key'>) {
    const { item, limitIsRiched } = await this.dacheModel.checkExists(key);

    if (item) {
      const updateResult = await this.dacheModel.update(key);
      return { message: DacheSearchMsg.Hit, item: updateResult.value };
    }

    const value = randomize('*', 27);
    if (limitIsRiched) {
      await this.dacheModel.createThroughOverride(key, value);
      // console.log(`Dache save. Added through REUSE value: ${createResult.value}`);
    } else {
      await this.dacheModel.create(key, value);
      // console.log(`Dache save. inserted id: ${result.insertedId}`);
    }

    return { message: DacheSearchMsg.Miss, item: { key, value } };
  }

  async remove(key: string) {
    const result = await this.dacheModel.getCollection().deleteOne({ key });

    return result.deletedCount;
  }

  async removeAll() {
    const result = await this.dacheModel.getCollection().deleteMany({});

    return result.deletedCount;
  }

  async update({ key, value }: Omit<Item, '_id'>) {
    const { item, limitIsRiched } = await this.dacheModel.checkExists(key);

    if (item) {
      await this.dacheModel.update(key, value);
      return { created: false };
    }

    if (limitIsRiched) {
      await this.dacheModel.createThroughOverride(key, value);
      // console.log(`Dache update. Added through REUSE value: ${createResult.value}`);
    } else {
      await this.dacheModel.create(key, value);
      // console.log(`Dache update. inserted id: ${result.insertedId}`);
    }

    return { created: true };
  }
}