import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as aiService from '../services/ai.service.js';

export const triageSchema = z.object({
  symptoms: z.string().min(5, 'Please provide more details about your symptoms.'),
});

export const triageSymptoms = asyncHandler(async (req, res) => {
  const result = await aiService.triageSymptoms(req.body.symptoms);
  res.status(200).json({ success: true, data: result });
});
