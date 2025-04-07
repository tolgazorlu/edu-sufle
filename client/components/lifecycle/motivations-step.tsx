"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

interface MotivationsStepProps {
  value: string[]
  onChange: (value: string[]) => void
}

const COMMON_MOTIVATIONS = [
  "Career advancement",
  "Personal growth",
  "Curiosity and learning",
  "Problem-solving",
  "Financial independence",
  "Making a positive impact",
  "Building something meaningful",
  "Intellectual challenge",
]

export default function MotivationsStep({ value, onChange }: MotivationsStepProps) {
  const [customMotivation, setCustomMotivation] = useState("")

  const handleCheckboxChange = (motivation: string, checked: boolean) => {
    if (checked) {
      onChange([...value, motivation])
    } else {
      onChange(value.filter((item) => item !== motivation))
    }
  }

  const handleAddCustomMotivation = () => {
    if (customMotivation.trim() && !value.includes(customMotivation.trim())) {
      onChange([...value, customMotivation.trim()])
      setCustomMotivation("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-center">What motivates you?</h2>
        <p className="text-muted-foreground text-center">Select the factors that drive you to learn and grow.</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMMON_MOTIVATIONS.map((motivation) => (
            <div key={motivation} className="flex items-center space-x-2">
              <Checkbox
                id={`motivation-${motivation}`}
                checked={value.includes(motivation)}
                onCheckedChange={(checked) => handleCheckboxChange(motivation, checked as boolean)}
              />
              <Label htmlFor={`motivation-${motivation}`} className="text-sm font-normal cursor-pointer">
                {motivation}
              </Label>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <Label htmlFor="custom-motivation" className="text-sm">
            Add your own motivation
          </Label>
          <div className="flex mt-1 space-x-2">
            <Input
              id="custom-motivation"
              value={customMotivation}
              onChange={(e) => setCustomMotivation(e.target.value)}
              placeholder="Enter a custom motivation"
              className="flex-1"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddCustomMotivation}
              disabled={!customMotivation.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {value.length > 0 && (
          <div className="pt-4">
            <Label className="text-sm">Selected motivations:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {value.map((item) => (
                <div
                  key={item}
                  className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {item}
                  <button
                    type="button"
                    className="ml-2 text-purple-600 hover:text-purple-800"
                    onClick={() => handleCheckboxChange(item, false)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

