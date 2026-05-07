import { Colors } from './colors';

export const Typography = {
  display: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.navy.primary
  },
  section: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.navy.primary
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.navy.primary
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.darkGray
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: Colors.midGray
  }
};
