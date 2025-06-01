export type UserStatus = "active" | "idle" | "inactive";

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

  static getStatusColor(status: UserStatus): string {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "idle":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  }

  static getStatusLabel(status: UserStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
} 