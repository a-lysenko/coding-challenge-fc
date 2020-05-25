import { Db } from 'mongodb';
import express from 'express';
import { DacheController, DacheSearchMsg} from '../../controllers/dache.controller';
import { DacheModel, Item } from '../../models/dache.model';

export const createRoutes = (dacheModel: DacheModel) => {
  const router = express.Router();

  const dacheController = new DacheController(dacheModel);
  // get all
  router.get('/', async (req, res) => {
    try {
      const items = await dacheController.getAll().toArray();
      res.send(items);
    } catch (err) {
      console.log('route item get all. ERROR');
      console.error(err);
      res.status(500).send(err);
    }
  });

  // create one
  router.post<null, { message: DacheSearchMsg, item: Omit<Item, '_id'> }, { key: string }>(
    '/',
    async (req, res) => {
      try {
        const result = await dacheController.save(req.body);
        return res.status(
          result.message === DacheSearchMsg.Miss ? 201 : 200
        )
          .send(result);
      } catch (err) {
        console.log('route item post. ERROR');
        console.error(err);
        res.status(500).send(err);
      }
    }
  );

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
  router.put<{ id: string }, {}, Pick<Item, 'value'>>('/:id', async (req, res) => {
    try {
      const result = await dacheController.update({
        key: req.params.id,
        value: req.body.value
      });
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