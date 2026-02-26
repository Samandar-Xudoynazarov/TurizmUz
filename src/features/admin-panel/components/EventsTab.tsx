import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import type { EventItem } from "../helpers";

type Props = {
  basePath: string;
  pendingEvents: EventItem[];
  approvedEvents: EventItem[];
  onApprove: (eventId: number) => void;
  onOpenReject: (eventId: number) => void;
};

export default function EventsTab({ basePath, pendingEvents, approvedEvents, onApprove, onOpenReject }: Props) {
  return (
    <div className="space-y-6">
      {pendingEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-violet-500 rounded-full" />
            Kutilayotgan eventlar ({pendingEvents.length})
          </h3>
          <div className="space-y-3">
            {pendingEvents.map((ev) => (
              <Card key={ev.id} className="border-0 shadow-sm border-l-4 border-l-violet-400">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <Link to={`${basePath}/events/${ev.id}`} className="min-w-0">
                    <h4 className="font-semibold text-gray-900 hover:underline truncate">{ev.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{ev.description}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {ev.locationName} • {new Date(ev.eventDateTime).toLocaleString()}
                    </p>
                    {ev.organizationName ? (
                      <p className="text-xs text-gray-400 mt-1 truncate">Tashkilot: {ev.organizationName}</p>
                    ) : null}
                  </Link>

                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onApprove(ev.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Tasdiqlash
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onOpenReject(ev.id)}>
                      <XCircle className="w-4 h-4 mr-1" />
                      Rad etish
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasdiqlangan eventlar ({approvedEvents.length})</h3>
        <div className="space-y-3">
          {approvedEvents.map((ev) => (
            <Card key={ev.id} className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <Link to={`/events/${ev.id}`} className="min-w-0">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    {ev.title}
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">Tasdiqlangan</Badge>
                  </h4>
                  <p className="text-sm text-gray-500 line-clamp-2">{ev.description}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {ev.locationName} • {new Date(ev.eventDateTime).toLocaleString()}
                  </p>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
