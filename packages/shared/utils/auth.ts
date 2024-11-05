import jwt from 'jsonwebtoken';

export function generateToken(payload: any, secret: string) {
  return jwt.sign(payload, secret);
}

export function createGenerateToken(secret: string) {
  return (payload: any) => generateToken(payload, secret);
}
