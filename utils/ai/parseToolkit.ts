import { toolkitSchema } from './validators';

export const parseToolkit = (input: unknown) => {
  return toolkitSchema.safeParse(input);
};
