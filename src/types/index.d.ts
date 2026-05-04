declare namespace Express {
  export interface Request {
    user?: { id: string; userId: string; email: string };
    rawBody: any;
  }
}
