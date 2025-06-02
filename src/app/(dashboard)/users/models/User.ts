import { supabase } from "@/lib/supabaseClient";

export interface User {
  id: string;
  name: string;
  email: string;
  user_role: "STUDENT" | "FACULTY/STAFF" | "PUBLIC";
  status: "active" | "idle" | "inactive";
  bookings: number;
  last_active: string;
  avatar?: string | null;
  first_name?: string;
  last_name?: string;
}

export interface UserDetails extends User {
  first_name: string;
  last_name: string;
  email_address: string;
  birthday: string;
  gender: string;
  weight: number;
  height: number;
  goal: string;
  contact?: string;
  role_status?: string;
  avatar?: string | null;
}

export interface UserFormData {
  first_name: string;
  last_name: string;
  email_address: string;
  birthday: string;
  gender: "male" | "female" | "prefer_not_to_say";
  weight: string;
  weight_unit: "kg" | "lbs";
  height: string;
  height_unit: "cm" | "ft";
  goal: "lose_weight" | "build_muscle" | "general_fitness" | "improve_endurance";
  contact?: string;
  user_role: "STUDENT" | "FACULTY/STAFF" | "PUBLIC";
  role_status?: "UNVERIFIED" | "VERIFIED";
}

export class UserModel {
  static async getAllUsers(): Promise<User[]> {
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, first_name, last_name, email_address, has_session, user_role, avatar");

      if (usersError) throw usersError;

      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("bookings")
        .select("user_id, created_at");

      if (sessionsError) throw sessionsError;

      // Fetch workouts
      const { data: workoutsData, error: workoutsError } = await supabase
        .from("workouts")
        .select("user_id, timestamp");

      if (workoutsError) throw workoutsError;

      // Process session counts
      const sessionCounts = (sessionsData || []).reduce((acc: Record<string, number>, curr: { user_id: string }) => {
        acc[curr.user_id] = (acc[curr.user_id] || 0) + 1;
        return acc;
      }, {});

      // Process last activity
      const lastActivityMap: Record<string, Date> = {};
      
      // Process sessions timestamps
      (sessionsData || []).forEach((session) => {
        if (session.created_at) {
          const timestamp = new Date(session.created_at);
          if (!lastActivityMap[session.user_id] || timestamp > lastActivityMap[session.user_id]) {
            lastActivityMap[session.user_id] = timestamp;
          }
        }
      });

      // Process workouts timestamps
      (workoutsData || []).forEach((workout) => {
        if (workout.timestamp) {
          const timestamp = new Date(workout.timestamp);
          if (!lastActivityMap[workout.user_id] || timestamp > lastActivityMap[workout.user_id]) {
            lastActivityMap[workout.user_id] = timestamp;
          }
        }
      });

      // Map to User interface
      return (usersData || []).map((user) => {
        const lastActivity = lastActivityMap[user.id];
        let status: "active" | "idle" | "inactive" = "inactive";
        
        if (lastActivity) {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          
          if (lastActivity >= oneDayAgo) {
            status = "active";
          } else if (lastActivity >= sixMonthsAgo) {
            status = "idle";
          } else {
            status = "inactive";
          }
        }

        return {
          id: user.id,
          name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User",
          email: user.email_address || "No email provided",
          user_role: user.user_role || "PUBLIC",
          status: status,
          bookings: sessionCounts[user.id] || 0,
          last_active: lastActivityMap[user.id] ? this.formatTimeAgo(lastActivityMap[user.id]) : "Never",
          avatar: user.avatar || null,
          first_name: user.first_name || "",
          last_name: user.last_name || ""
        };
      });
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      throw error;
    }
  }

  static async getUserById(userId: string): Promise<UserDetails | null> {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError) throw userError;
      return userData as UserDetails;
    } catch (error) {
      console.error("Error in getUserById:", error);
      throw error;
    }
  }

  static async createUser(formData: UserFormData, password: string): Promise<void> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email_address,
        password: password,
      });

      if (authError) throw authError;

      // Insert user profile
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user?.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email_address: formData.email_address,
        birthday: formData.birthday,
        gender: formData.gender,
        weight: formData.weight_unit === "lbs" 
          ? (parseFloat(formData.weight) * 0.453592).toFixed(2) 
          : formData.weight,
        height: formData.height_unit === "ft" 
          ? (parseFloat(formData.height) * 30.48).toFixed(2) 
          : formData.height,
        goal: formData.goal,
        contact: formData.contact || null,
        user_role: formData.user_role,
        role_status: formData.user_role === "FACULTY/STAFF" ? "UNVERIFIED" : null,
        has_session: null,
        avatar: null,
        verification_document_url: null,
      });

      if (profileError) throw profileError;
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }

  static async updateUser(userId: string, updated: Partial<UserDetails>): Promise<void> {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          first_name: updated.first_name,
          last_name: updated.last_name,
          email_address: updated.email_address,
          birthday: updated.birthday,
          gender: updated.gender,
          weight: updated.weight,
          height: updated.height,
          goal: updated.goal,
          contact: updated.contact,
          user_role: updated.user_role,
          role_status: updated.role_status,
        })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Error in updateUser:", error);
      throw error;
    }
  }

  static async insertUserProfile(userId: string, formData: UserFormData): Promise<void> {
    // Normalize role_status: treat "" as undefined
    let roleStatus = formData.role_status;
    if (!roleStatus) {
      // Normalize user_role for all possible faculty/staff variants
      const facultyRoles = ["FACULTY/STAFF", "FACULTY_STAFF", "STAFF/FACULTY", "STAFF_FACULTY"];
      roleStatus = facultyRoles.includes(formData.user_role) ? "UNVERIFIED" : "VERIFIED";
    }
    const { error } = await supabase.from("users").insert({
      id: userId,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email_address: formData.email_address,
      birthday: formData.birthday,
      gender: formData.gender,
      weight: formData.weight_unit === "lbs"
        ? (parseFloat(formData.weight) * 0.453592).toFixed(2)
        : formData.weight,
      height: formData.height_unit === "ft"
        ? (parseFloat(formData.height) * 30.48).toFixed(2)
        : formData.height,
      goal: formData.goal,
      contact: formData.contact || null,
      user_role: formData.user_role,
      role_status: roleStatus,
      has_session: null,
      avatar: null,
      verification_document_url: null,
    });
    if (error) throw error;
  }

  private static formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds <= 0) {
      return "Just now";
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return `${diffInSeconds} ${diffInSeconds === 1 ? 'second' : 'seconds'} ago`;
    }
  }
} 