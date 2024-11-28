import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { messageController } from '../controllers/messageController';

const router = Router();

router.post(
  '/',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      instanceId: Joi.string().uuid().required().messages({
        'any.required': 'O campo "instanceId" é obrigatório.',
        'string.guid': 'O campo "instanceId" deve ser um UUID válido.',
      }),
      phone: Joi.string().pattern(/^\d+$/).required().messages({
        'any.required': 'O campo "phone" é obrigatório.',
        'string.pattern.base': 'O campo "phone" deve conter apenas dígitos numéricos.',
      }),
      message: Joi.string().required().messages({
        'any.required': 'O campo "message" é obrigatório.',
        'string.empty': 'O campo "message" não pode estar vazio.',
      }),
    }),
  }),
  messageController.sendMessage
);

router.get('/history', messageController.getMessageHistory);

export default router;
