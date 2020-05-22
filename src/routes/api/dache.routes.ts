import { Db } from 'mongodb';
import express from 'express';
import { DacheController, DacheSearchMsg, Item } from '../../controllers/dache.controller';

export const createRoutes = (db: Db) => {
  const router = express.Router();

  const dacheController = new DacheController(null, db);
  // get all
  router.get('/', async (req, res) => {
    try {
      const items = await dacheController.getAll().toArray();
      console.log('route item get all. items', items);
      res.send(items);
    } catch (err) {
      console.log('route item get all. ERROR');
      console.error(err);
      res.status(500).send(err);
    }
  });

  // create one
  router.post<null, Omit<Item, '_id'>, { key: string }>('/', async (req, res) => {
    try {
      const result = await dacheController.save(req.body);
      console.log('route item post. result', result);
      return res.status(
        result.message === DacheSearchMsg.Miss ? 201 : 200
      )
        .send(result.item);
    } catch (err) {
      console.log('route item post. ERROR');
      console.error(err);
      res.status(500).send(err);
    }
  });

  // delete one
  router.delete<{ id: string }, null>('/:id', async (req, res) => {
    try {
      const deletedCount = await dacheController.remove(req.params.id);
      console.log('route item remove. deletedCount', deletedCount);
      res.sendStatus(204);
    } catch (err) {
      console.log('route item remove. ERROR');
      console.error(err);
      res.status(500).send(err);
    }
  });

  // delete all
  router.delete<null, null>('/', async (req, res) => {
    try {
      const deletedCount = await dacheController.removeAll();
      console.log('route dache remove all. deletedCount', deletedCount);
      res.sendStatus(204);
    } catch (err) {
      console.log('route dache remove all. ERROR');
      console.error(err);
      res.status(500).send(err);
    }
  });

  // update
  router.put<{id: string}, {}, Pick<Item, 'value'>>('/:id', async (req, res) => {
    try {
      const result = await dacheController.update({
        key: req.params.id,
        value: req.body.value
      });
      console.log('route item update. result', result);
      return res.sendStatus(
        result.created ? 201 : 204
      );
    } catch (err) {
      console.log('route item update. ERROR');
      console.error(err);
      res.status(500).send(err);
    }
  })

  return router;
}