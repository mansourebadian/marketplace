type Assignment = { memberKey: string; serviceIds: string };

// An absent assignment means all services, matching the booking availability rules.
export function isServiceOffered(serviceId: string, memberKeys: string[], assignments: Assignment[]): boolean {
  return memberKeys.some(memberKey => {
    const assignment = assignments.find(item => item.memberKey === memberKey);
    if (!assignment) return true;
    try {
      const ids: unknown = JSON.parse(assignment.serviceIds);
      return Array.isArray(ids) && ids.includes(serviceId);
    } catch {
      return false;
    }
  });
}
