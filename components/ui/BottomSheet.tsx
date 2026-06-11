import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';

import { useTheme } from '@/hooks/useTheme';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: string[];
};

export const BottomSheet = ({ visible, onClose, children, snapPoints }: BottomSheetProps) => {
  const { colors: Colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const points = useMemo(() => snapPoints ?? ['45%'], [snapPoints]);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={points}
      // v5 enables dynamic (content-based) sizing by default, which overrides
      // fixed snapPoints. Disable it so the sheet honours the % snap points.
      enableDynamicSizing={false}
      onDismiss={onClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      )}
      backgroundStyle={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: Colors.border, width: 40 }}
    >
      <View style={{ padding: 20 }}>{children}</View>
    </BottomSheetModal>
  );
};
