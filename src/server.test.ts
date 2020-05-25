import { createServer } from './server';
import { Express } from 'express';
import request from 'supertest';
import { Collection, MongoClient, ObjectId } from 'mongodb';

let instance: ReturnType<typeof createServer> extends Promise<infer R> ? R : never;
let app: Express;
let dbClient: MongoClient;
let dacheCollection: Collection;

beforeAll(async () => {
  if (process.env.DB_URI_TEST) {
    process.env.DB_URI = process.env.DB_URI_TEST
  }

  process.env.CACHE_LIMIT = '3';

  instance = await createServer();
  app = instance.app;
  dbClient = instance.dbClient;

  dacheCollection = dbClient.db().collection('dache');
});

beforeEach(() => {
  return dacheCollection.deleteMany({});
})

describe('Get all', () => {
  const docs = [
    { key: 'cache key 1', value: 'Random value 10' },
    { key: 'cache key 2', value: 'Random value 20' }
  ];

  beforeEach(async () => {
    return await dacheCollection.insertMany(
      docs.map(doc => ({ ...doc }))
    );
  });

  test('should retrieve all stored data', async (done) => {
    const result = await request(app).get('/api/cache');
    expect(result.status).toEqual(200);
    expect(result.body).toEqual(docs);
    done();
  });
});

describe('POST', () => {
  describe('for cached key', () => {
    const cachedKey = 'cached-key';
    const doc = { key: cachedKey, value: 'Random value 100' };

    beforeEach(() => {
      return dacheCollection.insertOne({ ...doc });
    });

    test('should retrieve item from db with log message', async () => {
      const result = await request(app)
        .post('/api/cache')
        .send({ key: cachedKey });

      expect(result.status).toEqual(200);
      expect(result.body).toEqual({
        message: 'Cache hit',
        item: expect.objectContaining(doc)
      });
    });
  })

  describe('for NON cached key (cache limit is NOT reached)', () => {
    const nonCachedKey = 'non-cached-key';

    test('should add new item to db', async () => {
      await request(app)
        .post('/api/cache')
        .send({ key: nonCachedKey });

      const result = await dacheCollection.findOne({ key: nonCachedKey });

      expect(result).toEqual({
        _id: expect.any(Object),
        key: nonCachedKey,
        value: expect.any(String),
        created: expect.any(Date)
      });
    });

    test('should retrieve newly created item from db with log message', async () => {
      const result = await request(app)
        .post('/api/cache')
        .send({ key: nonCachedKey });
      expect(result.status).toEqual(201);
      expect(result.body).toEqual({
        message: 'Cache miss',
        item: expect.objectContaining({
          key: nonCachedKey,
          value: expect.any(String)
        })
      });
    });
  })

  describe('for NON cached key (cache limit IS reached)', () => {
    const nonCachedKey = 'non-cached-key';
    const cacheOldestKey = 'cache-oldest-key';
    let oldestDocId: ObjectId;

    beforeEach(async () => {
      const docs = [
        { key: 'cache-key-1', value: 'cache-value-1', created: new Date() },
        { key: 'cache-key-2', value: 'cache-value-2', created: new Date(Date.now() - 10 * 1000) }
      ];
      const oldestDoc = { key: cacheOldestKey, value: 'cache-oldest-value', created: new Date(Date.now() - 60 * 1000) };

      await dacheCollection.insertMany(docs);
      const result = await dacheCollection.insertOne(oldestDoc);
      oldestDocId = result.insertedId;
    })

    test('should keep cache size within cache limit', async () => {
      await request(app)
        .post('/api/cache')
        .send({ key: nonCachedKey });

      const resultAll = await dacheCollection.find({}).toArray();
      expect(resultAll.length).toBe(3);
    })

    test('should add new item to db BY overriding the oldest one', async () => {
      await request(app)
        .post('/api/cache')
        .send({ key: nonCachedKey });
      const itemNonCachedKey = await dacheCollection.findOne({ key: nonCachedKey });

      expect(itemNonCachedKey).toEqual({
        _id: oldestDocId,
        key: nonCachedKey,
        value: expect.not.stringContaining('cache-oldest-value'),
        created: expect.any(Date)
      });
    })

    test('should retrieve newly cached item from db with log message', async () => {
      const result = await request(app)
        .post('/api/cache')
        .send({ key: nonCachedKey });
      expect(result.status).toEqual(201);
      expect(result.body).toEqual({
        message: 'Cache miss',
        item: expect.objectContaining({
          key: nonCachedKey,
          value: expect.any(String)
        })
      });
    })
  })
})

describe('UPDATE', () => {
  describe('for cached key', () => {
    const cachedKey = 'cached-key';
    const updatedValue = 'Updated value';

    const doc = { key: cachedKey, value: 'Random value 100' };

    beforeEach(() => {
      return dacheCollection.insertOne({ ...doc });
    });

    test('should update the db item', async () => {
      await request(app)
        .put(`/api/cache/${cachedKey}`)
        .send({ value: updatedValue });

      const result = await dacheCollection.find({ key: cachedKey }).toArray();

      expect(result).toStrictEqual([
        {
          _id: expect.any(Object),
          key: cachedKey,
          value: updatedValue,
          created: expect.any(Date)
        }
      ]);
    });

    test('should respond an update is successful', async () => {
      const result = await request(app)
        .put(`/api/cache/${cachedKey}`)
        .send({ value: updatedValue });

      expect(result.status).toEqual(204);
    });
  })

  describe('for NON cached key (cache limit is NOT reached)', () => {
    const nonCachedKey = 'non-cached-key';
    const updatedValue = 'Updated value';

    test('should add new item to db', async () => {
      await request(app)
        .put(`/api/cache/${nonCachedKey}`)
        .send({ value: updatedValue });

      const result = await dacheCollection.find({ key: nonCachedKey }).toArray();

      expect(result).toStrictEqual([
        {
          _id: expect.any(Object),
          key: nonCachedKey,
          value: updatedValue,
          created: expect.any(Date)
        }
      ]);
    });

    test('should respond an update is successful AS a creation', async () => {
      const result = await request(app)
        .put(`/api/cache/${nonCachedKey}`)
        .send({ value: updatedValue });

      expect(result.status).toEqual(201);
    });
  })

  describe('for NON cached key (cache limit IS reached)', () => {
    const nonCachedKey = 'non-cached-key';
    const cacheOldestKey = 'cache-oldest-key';
    let oldestDocId: ObjectId;

    beforeEach(async () => {
      const docs = [
        { key: 'cache-key-1', value: 'cache-value-1', created: new Date() },
        { key: 'cache-key-2', value: 'cache-value-2', created: new Date(Date.now() - 10 * 1000) }
      ];
      const oldestDoc = { key: cacheOldestKey, value: 'cache-oldest-value', created: new Date(Date.now() - 60 * 1000) };

      await dacheCollection.insertMany(docs);
      const result = await dacheCollection.insertOne(oldestDoc);
      oldestDocId = result.insertedId;
    })

    test('should keep cache size within cache limit', async () => {
      await request(app)
        .put('/api/cache')
        .send({ key: nonCachedKey });

      const resultAll = await dacheCollection.find({}).toArray();
      expect(resultAll.length).toBe(3);
    })

    test('should add new item to db BY overriding the oldest one', async () => {
      await request(app)
        .post('/api/cache')
        .send({ key: nonCachedKey });
      const itemNonCachedKey = await dacheCollection.findOne({ key: nonCachedKey });

      expect(itemNonCachedKey).toEqual({
        _id: oldestDocId,
        key: nonCachedKey,
        value: expect.not.stringContaining('cache-oldest-value'),
        created: expect.any(Date)
      });
    })

    test('should retrieve newly cached item from db with log message', async () => {
      const result = await request(app)
        .post('/api/cache')
        .send({ key: nonCachedKey });
      expect(result.status).toEqual(201);
      expect(result.body).toEqual({
        message: 'Cache miss',
        item: expect.objectContaining({
          key: nonCachedKey,
          value: expect.any(String)
        })
      });
    })
  })
});

describe('Remove', () => {
  const docs = [
    { key: 'cache-key-1', value: 'Random value 10' },
    { key: 'cache-key-2', value: 'Random value 20' }
  ];

  beforeEach(async () => {
    return await dacheCollection.insertMany(
      docs.map(doc => ({ ...doc }))
    );
  });

  test('should remove given item from the collection', async () => {
    await request(app).delete('/api/cache/cache-key-1');
    const result = await dacheCollection.find({}).toArray();
    expect(result).toStrictEqual([
      expect.objectContaining(
        { _id: expect.any(Object), key: 'cache-key-2', value: 'Random value 20' }
      )
    ]);
  })

  test('should respond a deletion is successful', async () => {
    const result = await request(app).delete('/api/cache/cache-key-1');
    expect(result.status).toBe(204);
  })
});

describe('Remove all', () => {
  const docs = [
    { key: 'cache key 1', value: 'Random value 10' },
    { key: 'cache key 2', value: 'Random value 20' }
  ];

  beforeEach(async () => {
    return await dacheCollection.insertMany(
      docs.map(doc => ({ ...doc }))
    );
  });

  test('should clear all the collection', async () => {
    await request(app).delete('/api/cache');
    const result = await dacheCollection.find({}).toArray();
    expect(result).toStrictEqual([]);
  })

  test('should respond a deletion is success', async () => {
    const result = await request(app).delete('/api/cache');
    expect(result.status).toBe(204);
  })
});

afterAll(async () => {
  await dbClient.close();
});