import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

const SIZE = 64;
const CENTER = SIZE / 2;

/**
 * Each arm stops short of the centre, so the target pixel is never covered. The `+` is drawn
 * twice (dark outline, then white stroke) to stay visible over bright roofs and dark shadows.
 */
const ARMS: ReadonlyArray<readonly [x1: number, y1: number, x2: number, y2: number]> = [
  [6, CENTER, 26, CENTER],
  [38, CENTER, 58, CENTER],
  [CENTER, 6, CENTER, 26],
  [CENTER, 38, CENTER, 58],
];

/**
 * Static `+` pinned to the exact centre of its parent. It must be rendered inside the same
 * container as the map, so the two share one centre point. It never moves or re-renders:
 * the map pans underneath it.
 */
function Crosshair() {
  return (
    <View
      pointerEvents="none"
      style={styles.layer}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {ARMS.map(([x1, y1, x2, y2]) => (
          <Line
            key={`outline-${x1}-${y1}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(0,0,0,0.6)"
            strokeWidth={4}
            strokeLinecap="round"
          />
        ))}
        {ARMS.map(([x1, y1, x2, y2]) => (
          <Line
            key={`line-${x1}-${y1}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
        <Circle cx={CENTER} cy={CENTER} r={2} fill="#FF3B30" stroke="#FFFFFF" strokeWidth={1} />
      </Svg>
    </View>
  );
}

export default memo(Crosshair);

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
