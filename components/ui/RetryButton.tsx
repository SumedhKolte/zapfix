import { Button } from './Button';

type RetryButtonProps = {
  onPress: () => void;
};

export const RetryButton = ({ onPress }: RetryButtonProps) => {
  return (
    <Button variant="secondary" onPress={onPress}>
      Retry
    </Button>
  );
};
