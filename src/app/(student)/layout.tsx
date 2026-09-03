import { StudentNav } from "@/components/layouts/StudentNav";
import { RoleAuthGuard } from "@/components/providers/RoleAuthGuard";
import { DepositGuard } from "@/components/providers/DepositGuard";
import { UserRole } from "@/types/enums";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleAuthGuard
      allowedRoles={[UserRole.STUDENT]}
      incompleteProfilePath="/student/register"
    >
      <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
        <StudentNav />
        <main className="flex-1 px-4 py-6 pb-20 sm:pb-6">
          <DepositGuard>{children}</DepositGuard>
        </main>
      </div>
    </RoleAuthGuard>
  );
}
