import { asyncHandler } from '../utils/asyncHandler.js';
import * as userService from '../services/user.service.js';

export const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.getUsers();
  res.status(200).json({ success: true, data: users });
});
