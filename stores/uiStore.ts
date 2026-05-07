import { create } from 'zustand';

type BottomSheetState = {
  visible: boolean;
  content: string;
};

type UiState = {
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, message?: string) => void;
  bottomSheet: BottomSheetState;
  showBottomSheet: (content: string) => void;
  hideBottomSheet: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  isLoading: false,
  loadingMessage: '',
  setLoading: (isLoading, message) =>
    set({ isLoading, loadingMessage: message ?? '' }),
  bottomSheet: { visible: false, content: '' },
  showBottomSheet: (content) => set({ bottomSheet: { visible: true, content } }),
  hideBottomSheet: () => set({ bottomSheet: { visible: false, content: '' } })
}));
