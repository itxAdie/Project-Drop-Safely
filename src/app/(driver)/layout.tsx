import { DriverNav } from "@/components/layouts/DriverNav";
import { RoleAuthGuard } from "@/components/providers/RoleAuthGuard";
import { UserRole } from "@/types/enums";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleAuthGuard
      allowedRoles={[UserRole.DRIVER]}
      incompleteProfilePath="/driver/register"
    >
      <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
        <DriverNav />
        <main className="flex-1 px-4 py-6 pb-20 sm:pb-6">{children}</main>
      </div>
    </RoleAuthGuard>
  );
}
