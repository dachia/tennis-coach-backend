import { IUser } from '../models/User';

// Main User Mapper
export const mapUser = (user: IUser) => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role
});