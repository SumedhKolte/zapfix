type NormalizedError = {
  title: string;
  message: string;
};

export const normalizeError = (error: unknown): NormalizedError => {
  if (error instanceof Error) {
    return {
      title: 'Something went wrong',
      message: error.message
    };
  }

  return {
    title: 'Something went wrong',
    message: 'Please try again.'
  };
};
