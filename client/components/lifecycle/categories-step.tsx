"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

interface CategoriesStepProps {
  value: string[]
  onChange: (value: string[]) => void
}

const COMMON_CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Machine Learning",
  "Blockchain",
  "Cybersecurity",
  "UI/UX Design",
  "Cloud Computing",
  "DevOps",
  "Game Development",
  "Artificial Intelligence",
  "Internet of Things",
  "Augmented/Virtual Reality",
  "Digital Marketing",
  "Business & Entrepreneurship",
]

export default function CategoriesStep({ value, onChange }: CategoriesStepProps) {
  const [customCategory, setCustomCategory] = useState("")

  const handleCheckboxChange = (category: string, checked: boolean) => {
    if (checked) {
      onChange([...value, category])
    } else {
      onChange(value.filter((item) => item !== category))
    }
  }

  const handleAddCustomCategory = () => {
    if (customCategory.trim() && !value.includes(customCategory.trim())) {
      onChange([...value, customCategory.trim()])
      setCustomCategory("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-center">What categories interest you?</h2>
        <p className="text-muted-foreground text-center">Select the areas you'd like to explore and learn about.</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2">
          {COMMON_CATEGORIES.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={value.includes(category)}
                onCheckedChange={(checked) => handleCheckboxChange(category, checked as boolean)}
              />
              <Label htmlFor={`category-${category}`} className="text-sm font-normal cursor-pointer">
                {category}
              </Label>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <Label htmlFor="custom-category" className="text-sm">
            Add your own category
          </Label>
          <div className="flex mt-1 space-x-2">
            <Input
              id="custom-category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Enter a custom category"
              className="flex-1"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddCustomCategory}
              disabled={!customCategory.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {value.length > 0 && (
          <div className="pt-4">
            <Label className="text-sm">Selected categories:</Label>
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

