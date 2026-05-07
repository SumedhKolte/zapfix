import { diagnosisSchema } from './validators';

export const parseDiagnosis = (input: unknown) => {
  return diagnosisSchema.safeParse(input);
};
