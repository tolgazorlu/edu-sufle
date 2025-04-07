"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import LifeGoalsStep from "@/components/lifecycle/life-goals-step"
import MotivationsStep from "@/components/lifecycle/motivations-step"
import CategoriesStep from "@/components/lifecycle/categories-step"
import OccupationStep from "@/components/lifecycle/occupation-step"
import SurveySummary from "@/components/lifecycle/survey-summary"
import SurveyProgress from "@/components/lifecycle/survey-progress"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export type SurveyData = {
  lifeGoals: string
  motivations: string[]
  categories: string[]
  occupation: string
}

export default function Lifecycle() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [surveyData, setSurveyData] = useState<SurveyData>({
    lifeGoals: "",
    motivations: [],
    categories: [],
    occupation: "",
  })

  const totalSteps = 5

  const updateSurveyData = (field: keyof SurveyData, value: string | string[]) => {
    setSurveyData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      // Here you would typically send the data to your API
      console.log("Submitting survey data:", surveyData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to dashboard or confirmation page
      router.push("/dashboard")
    } catch (error) {
      console.error("Error submitting survey:", error)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <LifeGoalsStep value={surveyData.lifeGoals} onChange={(value) => updateSurveyData("lifeGoals", value)} />
      case 2:
        return (
          <MotivationsStep
            value={surveyData.motivations}
            onChange={(value) => updateSurveyData("motivations", value)}
          />
        )
      case 3:
        return (
          <CategoriesStep value={surveyData.categories} onChange={(value) => updateSurveyData("categories", value)} />
        )
      case 4:
        return (
          <OccupationStep value={surveyData.occupation} onChange={(value) => updateSurveyData("occupation", value)} />
        )
      case 5:
        return <SurveySummary data={surveyData} />
      default:
        return null
    }
  }

  const isNextDisabled = () => {
    switch (currentStep) {
      case 1:
        return !surveyData.lifeGoals.trim()
      case 2:
        return surveyData.motivations.length === 0
      case 3:
        return surveyData.categories.length === 0
      case 4:
        return !surveyData.occupation.trim()
      default:
        return false
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="container mx-auto py-4">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-center text-2xl">Welcome to Sufle Learning Journey</CardTitle>
                <p className="text-center text-white/80">Let's personalize your educational roadmap</p>
              </CardHeader>
              <CardContent className="pt-6">
                <SurveyProgress currentStep={currentStep} totalSteps={totalSteps} />
                <div className="mt-6 min-h-[300px]">{renderStep()}</div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
                  Back
                </Button>
                {currentStep < totalSteps ? (
                  <Button onClick={handleNext} disabled={isNextDisabled()} className="bg-purple-600 hover:bg-purple-700">
                    Next
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                    Submit
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

