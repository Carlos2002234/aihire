import { MailCheck } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export default function VerifyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <EmptyState
        icon={MailCheck}
        title="Revisá tu email"
        description="Te mandamos un link de verificación. Una vez que confirmes tu cuenta vas a poder iniciar sesión."
        className="max-w-sm border-none"
      />
    </main>
  );
}
