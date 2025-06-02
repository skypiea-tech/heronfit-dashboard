export type UserStatus = "active" | "idle" | "inactive";
export type UserStatusOverride = "active_override" | "idle_override" | "inactive_override" | null;

export class UserStatusModel {
  static determineStatus(lastActivity: Date | null): UserStatus {
    if (!lastActivity) return "inactive";

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    if (lastActivity >= oneDayAgo) {
      return "active";
    } else if (lastActivity >= sixMonthsAgo) {
      return "idle";
    } else {
      return "inactive";
    }
  }

  static getStatusColor(status: UserStatus | UserStatusOverride): string {
    switch (status) {
      case "active":
      case "active_override":
        return "bg-green-100 text-green-800";
      case "idle":
      case "idle_override":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
      case "inactive_override":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  }

  static getStatusLabel(status: UserStatus | UserStatusOverride): string {
    if (!status) return "Auto-assign";
    return status.replace("_override", "").charAt(0).toUpperCase() + status.replace("_override", "").slice(1);
  }

  static isOverride(status: UserStatus | UserStatusOverride): boolean {
    return status?.includes("_override") || false;
  }

  static getOverrideStatus(status: UserStatus): UserStatusOverride {
    return `${status}_override` as UserStatusOverride;
  }

  static removeOverride(status: UserStatusOverride): UserStatus {
    return status?.replace("_override", "") as UserStatus;
  }
} 