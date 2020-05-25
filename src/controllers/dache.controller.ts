import { Collection, Db } from 'mongodb';
import randomize from 'randomatic';
import { CollectionName, DacheModel, Item } from '../models/dache.model';

export enum DacheSearchMsg {
  Miss = 'Cache miss',
  Hit = 'Cache hit'
}

export class DacheController {
  #collection: Collection<Item>;

  constructor(private db: Db, private dacheModel: DacheModel) {
    this.#collection = db.collection(CollectionName.Dache);
  }

  getAll() {
    return this.#collection.find({}, { projection: { _id: 0 } });
  }

  async save({ key }: Pick<Item, 'key'>) {
    const {item, limitIsRiched} = await this.dacheModel.checkExists(key);

    if (item) {
      const updatedItem = await this.dacheModel.update(key);

      return { message: DacheSearchMsg.Hit, item: updatedItem.value };
    }

    const value = randomize('*', 27);
    const result = await this.dacheModel.create(key, value);

    console.log(`Dache save. inserted id: ${result.insertedId}`);

    return { message: DacheSearchMsg.Miss, item: { key, value } };
  }

  async remove(key: string) {
    const result = await this.#collection.deleteOne({ key });

    return result.deletedCount;
  }

  async removeAll() {
    const result = await this.#collection.deleteMany({});

    return result.deletedCount;
  }

  async update({ key, value }: Omit<Item, '_id'>) {
    const {item, limitIsRiched} = await this.dacheModel.checkExists(key);

    if (item) {
      const updatedItem = this.dacheModel.update(key, value);
      return { created: false };
    }

    const result = await this.dacheModel.create(key, value);

    console.log(`Dache update. inserted id: ${result.insertedId}`, result);

    return { created: true };
  }
}