"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface LifeGoalsStepProps {
  value: string
  onChange: (value: string) => void
}

export default function LifeGoalsStep({ value, onChange }: LifeGoalsStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-center">What are your life goals?</h2>
        <p className="text-muted-foreground text-center">
          Tell us about your long-term aspirations and what you hope to achieve.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="life-goals">Your life goals</Label>
        <Textarea
          id="life-goals"
          placeholder="I want to become a software engineer and build applications that help people learn..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[150px]"
        />
        <p className="text-xs text-muted-foreground">
          This helps us understand your big-picture objectives to tailor your learning journey.
        </p>
      </div>
    </div>
  )
}

