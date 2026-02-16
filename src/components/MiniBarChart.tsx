// ==========================================
// MiniBarChart — 심플 바 차트 (7일 데이터)
// ==========================================
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { DailyCount } from '../types';

interface MiniBarChartProps {
  data: DailyCount[];
  height?: number;
  barColor?: string;
  labelColor?: string;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default React.memo(function MiniBarChart({
  data,
  height = 100,
  barColor = COLORS.primary,
  labelColor = COLORS.gray400,
}: MiniBarChartProps) {
  const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);

  return (
    <View style={[styles.container, { height: height + 24 }]}>
      {data.map((item, i) => {
        const barH = (item.count / maxCount) * height;
        const dayLabel = DAYS[new Date(item.date).getDay()];
        return (
          <View key={item.date} style={styles.col} accessibilityLabel={`${dayLabel}요일 ${item.count}회`}>
            <Text style={[styles.countLabel, { color: labelColor }]}>{item.count}</Text>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(barH, 4),
                    backgroundColor: barColor,
                    opacity: i === data.length - 1 ? 1 : 0.6,
                  },
                ]}
              />
            </View>
            <Text style={[styles.dayLabel, { color: labelColor }]}>{dayLabel}</Text>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  barWrapper: { justifyContent: 'flex-end' },
  bar: { width: '100%', minWidth: 16, maxWidth: 32, borderRadius: 4 },
  countLabel: { fontSize: 10, fontWeight: '600' },
  dayLabel: { fontSize: 10 },
});
