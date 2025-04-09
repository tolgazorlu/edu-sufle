import type { SurveyData } from "@/app/app/lifecycle/page"
import { Card, CardContent } from "@/components/ui/card"

interface SurveySummaryProps {
  data: SurveyData
}

export default function SurveySummary({ data }: SurveySummaryProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-center">Review Your Information</h2>
        <p className="text-muted-foreground text-center">
          Please review the information you&apos;ve provided before submitting.
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-purple-700">Life Goals</h3>
                <p className="mt-1 text-sm">{data.lifeGoals}</p>
              </div>

              <div>
                <h3 className="font-medium text-purple-700">Motivations</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.motivations.map((motivation) => (
                    <span key={motivation} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                      {motivation}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-purple-700">Interested Categories</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.categories.map((category) => (
                    <span key={category} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-purple-700">Occupation</h3>
                <p className="mt-1 text-sm">{data.occupation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            By submitting this information, you&apos;ll help us create a personalized learning roadmap tailored to your goals
            and interests. You can always update your preferences later.
          </p>
        </div>
      </div>
    </div>
  )
}

