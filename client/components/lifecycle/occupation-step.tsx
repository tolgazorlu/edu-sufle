"use client"

import type React from "react"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface OccupationStepProps {
  value: string
  onChange: (value: string) => void
}

const COMMON_OCCUPATIONS = [
  "Student",
  "Software Developer",
  "Data Scientist",
  "Designer",
  "Product Manager",
  "Entrepreneur",
  "Educator",
  "Marketing Professional",
  "Finance Professional",
  "Healthcare Professional",
  "Other",
]

export default function OccupationStep({ value, onChange }: OccupationStepProps) {
  const handleSelectChange = (selectedValue: string) => {
    onChange(selectedValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-center">What is your occupation?</h2>
        <p className="text-muted-foreground text-center">Tell us about your current role or profession.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="occupation-select">Select your occupation</Label>
          <Select onValueChange={handleSelectChange} value={COMMON_OCCUPATIONS.includes(value) ? value : "Other"}>
            <SelectTrigger id="occupation-select">
              <SelectValue placeholder="Select an occupation" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_OCCUPATIONS.map((occupation) => (
                <SelectItem key={occupation} value={occupation}>
                  {occupation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(value === "Other" || !COMMON_OCCUPATIONS.includes(value)) && (
          <div className="space-y-2">
            <Label htmlFor="custom-occupation">Specify your occupation</Label>
            <Input
              id="custom-occupation"
              placeholder="Enter your occupation"
              value={value === "Other" ? "" : value}
              onChange={handleInputChange}
            />
          </div>
        )}

        <div className="pt-4">
          <p className="text-sm text-muted-foreground">
            Your occupation helps us tailor learning resources that align with your professional background and career
            goals.
          </p>
        </div>
      </div>
    </div>
  )
}

