import React from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SurveyProgress from "@/components/lifecycle/survey-progress"
import LifeGoalsStep from "@/components/lifecycle/life-goals-step"
import MotivationsStep from "@/components/lifecycle/motivations-step"
import CategoriesStep from "@/components/lifecycle/categories-step"
import OccupationStep from "@/components/lifecycle/occupation-step"
import SurveySummary from "@/components/lifecycle/survey-summary"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Web3 from "web3"
import { SUFLE_CONTRACT_ADDRESS, SUFLE_ABI } from "@/lib/contracts"

export type SurveyData = {
  lifeGoals: string
  motivations: string[]
  categories: string[]
  occupation: string
}

const page = () => {
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(1)
  const [surveyData, setSurveyData] = useState<SurveyData>({
    lifeGoals: "",
    motivations: [],
    categories: [],
    occupation: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setIsSubmitting(true)
      setError(null)

      if (!window.ethereum) {
        throw new Error("Please install MetaMask")
      }

      const web3 = new Web3(window.ethereum)
      const accounts = await web3.eth.requestAccounts()
      const account = accounts[0]

      console.log("Submitting survey with account:", account)
      console.log("Contract address:", SUFLE_CONTRACT_ADDRESS)
      console.log("Survey data:", surveyData)

      const contract = new web3.eth.Contract(SUFLE_ABI, SUFLE_CONTRACT_ADDRESS)

      // Send the transaction and wait for it to be mined
      const transaction = await contract.methods
        .createUserSurvey(
          surveyData.occupation,
          surveyData.categories,
          surveyData.motivations,
          surveyData.lifeGoals
        )
        .send({ from: account })

      console.log("Transaction hash:", transaction.transactionHash)
      console.log("Transaction receipt:", transaction)

      // Wait for a few blocks to ensure the transaction is confirmed
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Verify the survey was created
      const surveyCount = Number(await contract.methods.getUserSurveyCount(account).call())
      console.log("Survey count after submission:", surveyCount)

      if (surveyCount === 0) {
        throw new Error("Survey submission failed - survey count is still 0")
      }

      // Store survey data in localStorage for faster access
      localStorage.setItem("surveyData", JSON.stringify(surveyData))
      localStorage.setItem("surveyCompleted", "true")

      // Redirect to app
      router.push("/app")
    } catch (error) {
      console.error("Error submitting survey:", error)
      setError(error instanceof Error ? error.message : "Failed to submit survey. Please try again.")
    } finally {
      setIsSubmitting(false)
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
    <Card className="border-none shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="text-center text-2xl">Welcome to Sufle Learning Journey</CardTitle>
        <p className="text-center text-white/80">Let&apos;s personalize your educational roadmap</p>
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
          <Button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        )}
      </CardFooter>
      {error && (
        <div className="px-6 pb-6 text-red-500 text-sm">
          {error}
        </div>
      )}
    </Card>
  )
}

export default page