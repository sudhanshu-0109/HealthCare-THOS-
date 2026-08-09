import prisma from '../prisma/client.js';

export const getUsers = async () => {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      createdAt: true,
    }
  });
};
