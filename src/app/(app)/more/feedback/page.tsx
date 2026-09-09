import { SubHeader } from "../_SubHeader";
import { FeedbackForm } from "@/components/FeedbackForm";
import { requireUser } from "@/server/auth";
import { sendFeedback } from "./actions";

export const metadata = { title: "Send feedback" };
export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  await requireUser();

  return (
    <>
      <SubHeader title="Send feedback" />
      <div className="px-5 pb-8">
        <FeedbackForm onSend={sendFeedback} />
      </div>
    </>
  );
}
