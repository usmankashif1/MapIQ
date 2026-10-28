import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconName =
  | 'ruler'
  | 'invoice'
  | 'bell'
  | 'briefcase'
  | 'chevron'
  | 'map'
  | 'calculator'
  | 'back'
  | 'lock'
  | 'share';

type Props = {
  name: IconName;
  color?: string;
  size?: number;
};

function BusinessIcon({ name, color = '#FFFFFF', size = 28 }: Props) {
  const shared = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'ruler' && (
        <>
          <Path {...shared} d="m4 8 12-4 4 12-12 4z" />
          <Path {...shared} d="m8 8 1 3m2-4 1 3m2-4 1 3" />
        </>
      )}
      {name === 'invoice' && (
        <>
          <Path {...shared} d="M5 3.5h11l3 3v10H5z" />
          <Path {...shared} d="M16 3.5v3h3M8 10h8M8 13h5" />
          <Circle cx={18} cy={18} r={4} fill={color} />
          <Path d="M18 16v4m-2-2h4" stroke="#16A765" strokeWidth={1.6} strokeLinecap="round" />
        </>
      )}
      {name === 'bell' && (
        <>
          <Path {...shared} d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <Path {...shared} d="M10 21h4" />
          <Circle cx={19} cy={5} r={3} fill="#F04B4B" stroke="#FFFFFF" strokeWidth={1} />
        </>
      )}
      {name === 'briefcase' && (
        <>
          <Rect {...shared} x={3} y={7} width={18} height={13} rx={2} />
          <Path {...shared} d="M8 7V4h8v3M3 12h18m-11 0v2h4v-2" />
        </>
      )}
      {name === 'chevron' && <Path {...shared} d="m9 18 6-6-6-6" />}
      {name === 'map' && (
        <>
          <Path {...shared} d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
          <Path {...shared} d="M9 3v15m6-12v15" />
          <Circle cx={14} cy={10} r={2} fill={color} />
        </>
      )}
      {name === 'calculator' && (
        <>
          <Rect {...shared} x={5} y={2.5} width={14} height={19} rx={2} />
          <Path {...shared} d="M8 6h8v3H8zM8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01" />
        </>
      )}
      {name === 'back' && <Path {...shared} d="m15 18-6-6 6-6M9 12h12" />}
      {name === 'lock' && (
        <>
          <Rect {...shared} x={5} y={10} width={14} height={11} rx={2} />
          <Path {...shared} d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
        </>
      )}
      {name === 'share' && (
        <>
          <Path {...shared} d="M12 16V3m-5 5 5-5 5 5" />
          <Path {...shared} d="M5 12v8h14v-8" />
        </>
      )}
    </Svg>
  );
}

export default BusinessIcon;
