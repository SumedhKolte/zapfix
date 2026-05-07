import { interviewSchema } from './validators';

export const parseInterview = (input: unknown) => {
  return interviewSchema.safeParse(input);
};
