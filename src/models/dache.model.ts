import dotenv from 'dotenv';
import { Collection, Db, MongoClient, ObjectId } from 'mongodb';

dotenv.config();

export interface Item {
  _id: ObjectId;
  key: string;
  value: string;
  created?: Date;
}

type CheckExists = { item: Item, limitIsRiched: null } | { item: null, limitIsRiched: boolean };

const defaultTTL = 10 * 60 * 1000;

export class DacheModel {
  #collection: Collection<Item>;
  #ttl: number;
  #cacheLimit: number;

  constructor(db: Db, ttl = defaultTTL, cacheLimit = process.env.CACHE_LIMIT) {
    this.#collection = db.collection(CollectionName.Dache);
    this.#ttl = ttl;
    this.#cacheLimit = Number(cacheLimit) || -1;
  }

  getCollection() {
    return this.#collection;
  }

  update(key: string, value: string = null) {
    return this.#collection.findOneAndUpdate(
      { key },
      {
        ...(
          value == null
            ? null
            : { $set: { value } }
        ),
        $currentDate: { created: true }
      },
      { returnOriginal: false, projection: { _id: 0, key: 1, value: 1 } }
    );
  }

  create(key: string, value: string) {
    const itemToSave = {
      key,
      value,
      created: new Date()
    };
    return this.#collection.insertOne(itemToSave);
  }

  // This method find the oldest item from the cached ones
  // and replaces its data: key, value, created date
  createThroughOverride(key: string, value: string) {
    return this.#collection.findOneAndUpdate(
      {},
      {
        $set: { key, value },
        $currentDate: { created: true }
      },
      {
        sort: { created: 1 },
        returnOriginal: false
      }
    );
  }

  async checkExists(key: string, customTTL?: number, customLimit?: number): Promise<CheckExists> {
    const item = await this.#collection.findOne({ key });
    if (!item) {
      const documentCount = await this.#collection.estimatedDocumentCount();
      const cacheLimit = (customLimit || this.#cacheLimit);

      return {
        item: null, limitIsRiched: cacheLimit !== -1 && documentCount >= cacheLimit
      };
    }
    return { item, limitIsRiched: null };
  }

  static async createClient(
    DB_URI: string,
    connectAutomatically = true
  ) {
    const client = new MongoClient(
      DB_URI,
      { useNewUrlParser: true, useUnifiedTopology: true }
    );

    if (connectAutomatically) {
      await client.connect();
    }

    const db = client.db();
    return { client, db };
  }
}

export enum CollectionName {
  Dache = 'dache'
}