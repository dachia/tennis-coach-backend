import * as yup from 'yup';
import { UserRole } from "../../shared/constants/UserRole";

export const registerSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
  name: yup.string().required(),
  role: yup.string().oneOf(Object.values(UserRole)).required()
});

export const loginSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required()
}); 