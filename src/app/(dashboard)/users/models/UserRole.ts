export type UserRole = "STUDENT" | "FACULTY_STAFF" | "PUBLIC";
export type RoleStatus = "UNVERIFIED" | "VERIFIED" | null;

export class UserRoleModel {
  static getRoleColor(role: UserRole): string {
    switch (role) {
      case "STUDENT":
        return "bg-blue-100 text-blue-800";
      case "FACULTY_STAFF":
        return "bg-purple-100 text-purple-800";
      case "PUBLIC":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  static getRoleLabel(role: UserRole): string {
    switch (role) {
      case "STUDENT":
        return "Student";
      case "FACULTY_STAFF":
        return "Faculty/Staff";
      case "PUBLIC":
        return "Public";
      default:
        return role;
    }
  }

  static getRoleStatusLabel(status: RoleStatus): string {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  static requiresVerification(role: UserRole): boolean {
    return role === "FACULTY_STAFF";
  }

  static getDefaultRoleStatus(role: UserRole): RoleStatus {
    return this.requiresVerification(role) ? "UNVERIFIED" : null;
  }
} 