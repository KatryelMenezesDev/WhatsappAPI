import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { instanceController } from '../controllers/instanceController';

const router = Router();

router.post(
  '/',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      name: Joi.string().required().messages({
        'any.required': 'O campo "name" é obrigatório.',
        'string.empty': 'O campo "name" não pode estar vazio.',
      }),
    }),
  }),
  instanceController.addInstance
);

router.get('/', instanceController.listInstances);

router.get(
  '/:id',
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.string().uuid().required().messages({
        'any.required': 'O parâmetro "id" é obrigatório.',
        'string.guid': 'O parâmetro "id" deve ser um UUID válido.',
      }),
    }),
  }),
  instanceController.getInstanceDetails
);

router.delete(
  '/:id',
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.string().uuid().required().messages({
        'any.required': 'O parâmetro "id" é obrigatório.',
        'string.guid': 'O parâmetro "id" deve ser um UUID válido.',
      }),
    }),
  }),
  instanceController.deleteInstance
);

export default router;
