import { AdminSidebar } from "@/components/layouts/AdminSidebar";
import { RoleAuthGuard } from "@/components/providers/RoleAuthGuard";
import { UserRole } from "@/types/enums";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleAuthGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <AdminSidebar />
        <main className="ml-0 flex-1 px-6 py-8 sm:ml-64">{children}</main>
      </div>
    </RoleAuthGuard>
  );
}
