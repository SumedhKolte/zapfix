import { Redirect, useLocalSearchParams } from 'expo-router';

// Legacy route. The matching/searching loop was replaced with the inline slot booking
// flow inside Diagnose. Old deep-links are forwarded to the relevant screen.
export default function MatchingRedirect() {
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  if (jobId) {
    return <Redirect href={`/(customer)/receipt/${jobId}`} />;
  }
  return <Redirect href="/(customer)/home" />;
}
