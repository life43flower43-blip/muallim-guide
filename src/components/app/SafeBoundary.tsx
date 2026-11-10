"use client";

// حاجز أمان: إذا تعطلت شاشة واحدة لا يتوقف التطبيق كله، بل تظهر رسالة هادئة وزر رجوع للرئيسية
import { Component, type ReactNode } from "react";
import { useUi } from "@/lib/ui-store";
import { reportClientError } from "@/lib/client-monitor";

/** يغلق كل الشاشات المفتوحة فوق التطبيق ويعود إلى الرئيسية */
export function closeAllScreens() {
  const st = useUi.getState() as unknown as Record<string, unknown>;
  const patch: Record<string, unknown> = { quizConfig: null };
  for (const k of Object.keys(st)) if (k.endsWith("Open") && st[k] === true) patch[k] = false;
  useUi.setState(patch as never);
}

export default class SafeBoundary extends Component<{ children: ReactNode; full?: boolean }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("screen crashed:", error);
    reportClientError(error, "screen");
  }
  private back = () => {
    closeAllScreens();
    this.setState({ failed: false });
  };
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className={this.props.full ? "fixed inset-0 z-[60] flex items-center justify-center bg-background p-6" : "flex items-center justify-center p-6"}>
        <div className="max-w-sm rounded-[24px] border-2 border-[#E3EDE8] bg-white p-6 text-center dark:bg-card">
          <p className="text-[32px]" aria-hidden="true">🛠️</p>
          <p className="mt-2 font-extrabold text-foreground">تعذّر عرض هذه الشاشة</p>
          <p className="mt-1 text-[14px] leading-6 text-muted-foreground">تقدمك محفوظ. ارجع وجرّب مرة أخرى.</p>
          <button type="button" onClick={this.back} className="mt-4 min-h-[46px] w-full rounded-[18px] bg-[var(--t700)] font-bold text-white">
            الرجوع إلى الرئيسية
          </button>
        </div>
      </div>
    );
  }
}
