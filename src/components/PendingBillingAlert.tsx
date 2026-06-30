import { Bill } from '../types';

const PREVIEW_COUNT = 3;

type Props = {
  bills: Bill[];
  onViewAll: () => void;
};

function isOverdue(dateStr: string) {
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function isToday(dateStr: string) {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

export function PendingBillingAlert({ bills, onViewAll }: Props) {
  if (!bills.length) return null;

  const overdueCount = bills.filter((b) => isOverdue(b.eventDate)).length;
  const preview = bills.slice(0, PREVIEW_COUNT);
  const remaining = bills.length - PREVIEW_COUNT;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
      {/* Count block */}
      <div className="flex-shrink-0 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-center">
        <div className="text-xl font-medium leading-none text-blue-700">
          {bills.length}
        </div>
        <div className="mt-0.5 text-[9px] text-blue-400">orders</div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-2 text-sm font-medium text-blue-900">
          Pending billing start
        </div>

        <div className="divide-y divide-blue-100">
          {preview.map((bill) => {
            const overdue = isOverdue(bill.eventDate);
            // const today = isToday(bill.eventDate);
            return (
              <div key={bill.id} className="flex items-center gap-2 py-1.5">
                <span
                  className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                    overdue ? "bg-red-500" : "bg-orange-400"
                  }`}
                />
                <span className="flex-1 truncate text-xs font-medium text-blue-900">
                  {bill.customerName}
                </span>
                <span
                  className={`flex-shrink-0 text-[11px] ${
                    overdue ? "text-red-500" : "text-orange-500"
                  }`}
                >
                  {overdue
                    ? `Overdue — ${new Date(bill.eventDate).toLocaleDateString(
                        "en-IN",
                        { day: "numeric", month: "short" }
                      )}`
                    : "Today"}
                </span>
              </div>
            );
          })}
        </div>

        {remaining > 0 && (
          <div className="mt-1.5 text-[11px] text-blue-500">
            + {remaining} more {remaining === 1 ? "order" : "orders"}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 flex-col gap-1.5">
        <button
          onClick={onViewAll}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 active:scale-95"
        >
          View all
        </button>
        {overdueCount > 0 && (
          <span className="text-center text-[10px] font-medium text-red-500">
            {overdueCount} overdue
          </span>
        )}
      </div>
    </div>
  );
}
