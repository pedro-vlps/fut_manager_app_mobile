import { Children, PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useResponsive } from '@/contexts/responsive';

export function ResponsiveGrid({ children, maxColumns = 3 }: PropsWithChildren<{ maxColumns?: number }>) {
  const { columns } = useResponsive();
  const count = Math.min(columns, maxColumns);
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, alignItems: 'stretch' }}>
    {Children.toArray(children).map((child, index) => <View key={index} style={{ width: count === 3 ? '31.8%' : count === 2 ? '48.4%' : '100%', minWidth: 0 }}>
      {child}
    </View>)}
  </View>;
}
