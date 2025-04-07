import { Progress } from "@/components/ui/progress"

interface SurveyProgressProps {
  currentStep: number
  totalSteps: number
}

export default function SurveyProgress({ currentStep, totalSteps }: SurveyProgressProps) {
  const progressPercentage = (currentStep / totalSteps) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          Step {currentStep} of {totalSteps}
        </span>
        <span>{Math.round(progressPercentage)}%</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />

      <div className="flex justify-between mt-2">
        <div className={`text-xs ${currentStep >= 1 ? "text-purple-600 font-medium" : "text-muted-foreground"}`}>
          Life Goals
        </div>
        <div className={`text-xs ${currentStep >= 2 ? "text-purple-600 font-medium" : "text-muted-foreground"}`}>
          Motivations
        </div>
        <div className={`text-xs ${currentStep >= 3 ? "text-purple-600 font-medium" : "text-muted-foreground"}`}>
          Categories
        </div>
        <div className={`text-xs ${currentStep >= 4 ? "text-purple-600 font-medium" : "text-muted-foreground"}`}>
          Occupation
        </div>
        <div className={`text-xs ${currentStep >= 5 ? "text-purple-600 font-medium" : "text-muted-foreground"}`}>
          Review
        </div>
      </div>
    </div>
  )
}

