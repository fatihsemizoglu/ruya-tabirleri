import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UserDropdown() {
  return (
    <Button variant="ghost" size="icon">
      <User className="h-5 w-5" />
    </Button>
  );
}
