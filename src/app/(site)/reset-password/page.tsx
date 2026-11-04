// صفحة تعيين كلمة مرور جديدة من رابط البريد
import type { Metadata } from "next";
import ResetForm from "./ResetForm";

export const metadata: Metadata = { title: "تعيين كلمة مرور جديدة | تربوي", robots: { index: false, follow: false } };

export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <div className="mx-auto max-w-md py-6">
      <h1 className="font-display text-[24px] font-extrabold text-[#14302A]">تعيين كلمة مرور جديدة</h1>
      <ResetForm token={token} />
    </div>
  );
}
