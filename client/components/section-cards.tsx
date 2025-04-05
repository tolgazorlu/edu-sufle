import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Here you are</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-xl font-semibold">
            Tolga Zorlu
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
            <p><strong>Interest Categories:</strong> Education, Technology, Community</p>
            <p><strong>Motivations:</strong> Learning, Networking, Growth</p>
            <p><strong>Occupation:</strong> Educator</p>
            <p><strong>Life Goal:</strong> Empowering others through knowledge</p>
        </CardFooter>
      </Card>
    </div>
  )
}
