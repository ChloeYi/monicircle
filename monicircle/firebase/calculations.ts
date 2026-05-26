export function calcPaymentDates(
  startDate: Date,
  totalRounds: number,
  cycle: 'weekly' | 'monthly',
  paymentDay: number
): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < totalRounds; i++) {
    const d = new Date(startDate);
    if (cycle === 'monthly') {
      d.setMonth(d.getMonth() + i);
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(paymentDay, daysInMonth));
    } else {
      d.setDate(d.getDate() + i * 7);
    }
    dates.push(d);
  }
  return dates;
}

export function calcPotAmount(
  contributionAmount: number,
  totalMembers: number,
  approvedSpendingThisRound = 0
): number {
  return contributionAmount * totalMembers - approvedSpendingThisRound;
}

export function calcMemberContribution(
  contributionAmount: number,
  approvedPaymentsCount: number,
  totalRounds: number
) {
  return {
    totalPaid: contributionAmount * approvedPaymentsCount,
    remaining: contributionAmount * (totalRounds - approvedPaymentsCount),
  };
}

export function calcSavingsComparison(turnNumber: number, totalMembers: number) {
  return {
    monthsAlone: turnNumber,
    monthsWithGye: turnNumber,
    fasterBy: totalMembers - turnNumber,
  };
}

export function calcLeftoverSplit(
  sharedFundAmount: number,
  totalMembers: number,
  roundsCompleted: number,
  totalSpent: number
) {
  const totalCollected = sharedFundAmount * totalMembers * roundsCompleted;
  const leftover = totalCollected - totalSpent;
  return {
    leftover,
    perMember: leftover / totalMembers,
  };
}

export function isPaymentOverdue(dueDate: Date, paymentStatus: string): boolean {
  return new Date() > dueDate && paymentStatus !== 'approved';
}
