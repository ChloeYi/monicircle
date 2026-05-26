import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { colors } from '@/constants/colors';

type Member = {
  id: string;
  name: string;
  turnNumber: number;
  status: 'upcoming' | 'current' | 'complete';
};

type Props = {
  members: Member[];
  currentRound: number;
  size?: number;
};

export default function RotationCircle({ members, currentRound, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;

  const total = members.length;
  if (total === 0) return null;

  return (
    <Svg width={size} height={size}>
      {/* Background circle */}
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.border} strokeWidth={2} />

      {members.map((member, i) => {
        const angle = (2 * Math.PI * i) / total - Math.PI / 2;
        const mx = cx + r * Math.cos(angle);
        const my = cy + r * Math.sin(angle);

        const isCurrent = member.turnNumber === currentRound;
        const isComplete = member.status === 'complete';

        const dotColor = isCurrent
          ? colors.accent
          : isComplete
          ? colors.textLight
          : colors.primary;

        const dotR = isCurrent ? 16 : 12;

        return (
          <G key={member.id}>
            <Circle
              cx={mx}
              cy={my}
              r={dotR}
              fill={dotColor}
              opacity={isComplete ? 0.4 : 1}
            />
            <SvgText
              x={mx}
              y={my + 1}
              textAnchor="middle"
              alignmentBaseline="middle"
              fontSize={isCurrent ? 10 : 8}
              fontWeight="600"
              fill="#fff"
            >
              {member.turnNumber}
            </SvgText>
          </G>
        );
      })}

      {/* Center label */}
      <SvgText
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fontSize={13}
        fill={colors.textSecondary}
      >
        Round
      </SvgText>
      <SvgText
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fontSize={28}
        fontWeight="700"
        fill={colors.text}
      >
        {currentRound}
      </SvgText>
    </Svg>
  );
}
