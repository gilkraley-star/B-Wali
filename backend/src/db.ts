import { PrismaClient } from "@prisma/client";

// Instance unique du client Prisma, réutilisée partout dans l'app.
export const prisma = new PrismaClient();
