import { NextFunction, Request, Response } from "express";

// Express 4 n'intercepte pas l'erreur d'un handler "async" qui plante : la requête reste
// bloquée pour toujours côté téléphone (chargement infini), sans aucun message. Ce petit
// enrobage renvoie l'erreur à Express, qui répond alors proprement au lieu de rester muet.
export const ar =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
