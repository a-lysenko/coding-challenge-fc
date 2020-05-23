import { Collection, Db, ObjectId } from 'mongodb';
import randomize from 'randomatic';

export enum CollectionName {
  Dache = 'dache'
}

export enum DacheSearchMsg {
  Miss = 'Cache miss',
  Hit = 'Cache hit'
}

export interface Item {
  _id: ObjectId;
  key: string;
  value: string;
}

export class DacheController {
  #collection: Collection<Item>;

  constructor(private app: Express.Application, private db: Db) {
    this.#collection = db.collection(CollectionName.Dache);
  }

  getAll() {
    return this.#collection.find({}, { projection: { _id: 0 } });
  }

  async save({ key }: Pick<Item, 'key'>) {
    const item = await this.#collection.findOne({ key });

    if (item) {
      return { message: DacheSearchMsg.Hit, item };
    }

    const value = randomize('*', 27);

    console.log('DacheController save. value ', value);

    const result = await this.#collection.insertOne(
      { key, value }
    );

    console.log(`Dache save. inserted id: ${result.insertedId}`);

    return { message: DacheSearchMsg.Miss, item: { key, value } };
  }

  getItemByKey(key: string) {
    return this.#collection.findOne(
      { key }
    );
  }

  async remove(key: string) {
    const result = await this.#collection.deleteOne({ key });

    console.log(`Dache remove. Removed ${result.deletedCount}`);

    return result.deletedCount;
  }

  async removeAll() {
    const result = await this.#collection.deleteMany({});

    console.log(`Dache remove all. Removed ${result.deletedCount}`);

    return result.deletedCount;
  }

  async update({ key, value }: Omit<Item, '_id'>) {
    const result = await this.#collection.updateOne(
      { key },
      {
        $set: { value },
        $setOnInsert: { key }
      },
      { upsert: true }
    );

    console.log(`Dache update. Modified ${result.modifiedCount}, upserted ${result.upsertedCount}`);

    return {
      created: result.upsertedCount > 0
    };
  }
}