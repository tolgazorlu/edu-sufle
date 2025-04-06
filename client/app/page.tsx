"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Brain,
  Layers,
  LineChart,
  Sparkles,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { useOCAuth } from "@opencampus/ocid-connect-js";
import LoginButton from "@/components/LoginButton";
import Link from "next/link";
import { HoverEffect } from "@/components/ui/card-hover-effect";

const SECTION = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI-Powered Roadmaps",
    description:
      "Generate personalized learning paths tailored to your goals and interests using advanced AI technology.",
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    title: "Gamified Learning",
    description:
      "Complete tasks, earn rewards, and track your progress in an engaging, game-like educational environment.",
  },
  {
    icon: <Layers className="w-6 h-6" />,
    title: "Blockchain Rewards",
    description:
      "Earn EduTokens for completing tasks and receiving community validation on your learning journey.",
  },
  {
    icon: <LineChart className="w-6 h-6" />,
    title: "Progress Tracking",
    description:
      "Monitor your educational growth with detailed analytics and blockchain-verified achievements.",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Personalized Tasks",
    description:
      "Receive custom-tailored assignments that match your learning style and educational objectives.",
  },
  {
    icon: <ArrowRight className="w-6 h-6" />,
    title: "Decentralized Knowledge",
    description:
      "Participate in a community-driven ecosystem that values and rewards knowledge sharing.",
  },
];

export default function LandingPage() {
  const { authState } = useOCAuth();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="h-full bg-gradient-to-b from-slate-950 to-purple-950 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1000&width=1000')] bg-repeat opacity-5" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg blur opacity-50"></div>
          </div>
          <span className="text-xl font-bold">Sufle</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm hover:text-purple-300 transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm hover:text-purple-300 transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#technology"
            className="text-sm hover:text-purple-300 transition-colors"
          >
            Technology
          </Link>
          {mounted && authState.isAuthenticated ? (
            <Button
              onClick={() => {
                window.location.href = "/dashboard";
              }}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              Go to Dashboard
            </Button>
          ) : (
            <LoginButton />
          )}
        </div>
        <div className="md:hidden">
          {mounted && authState.isAuthenticated ? (
            <Button
              onClick={() => {
                window.location.href = "/dashboard";
              }}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              size="sm"
            >
              Dashboard
            </Button>
          ) : (
            <LoginButton />
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <div className="inline-block px-3 py-1 mb-4 text-xs font-medium bg-purple-900/50 text-purple-300 rounded-full border border-purple-700/50 backdrop-blur-sm">
                Blockchain-Powered Education
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200">
                Your AI-Guided Learning Journey
              </h1>
              <p className="mt-6 text-lg text-slate-300 max-w-lg">
                Create personalized educational roadmaps, complete tasks, and
                earn rewards in a decentralized ecosystem powered by blockchain
                technology.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {mounted && authState.isAuthenticated ? (
                <Button
                  onClick={() => {
                    window.location.href = "/dashboard";
                  }}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-6 h-auto text-lg group"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <div className="relative">
                  <LoginButton />
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur opacity-30 animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="relative z-10 bg-slate-900/80 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 shadow-2xl">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-20"></div>
              <Image
                src="/sufle-bg-1.jpg"
                width={800}
                height={600}
                alt="edu Sufle Dashboard Preview"
                className="rounded-lg object-cover w-full h-auto"
              />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-slate-950 to-transparent opacity-60 rounded-2xl"></div>
              <div className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-purple-200">
                      AI Recommendation
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      To learn AI fundamentals, start with Python basics, then
                      explore machine learning algorithms...
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 bg-slate-950/80 backdrop-blur-md py-24"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Revolutionizing Education with Blockchain
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              edu Sufle combines AI-powered learning paths with blockchain
              incentives to create a unique educational experience.
            </p>
          </div>

          {/* {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: "AI-Powered Roadmaps",
                description:
                  "Generate personalized learning paths tailored to your goals and interests using advanced AI technology.",
              },
              {
                icon: <Trophy className="w-6 h-6" />,
                title: "Gamified Learning",
                description:
                  "Complete tasks, earn rewards, and track your progress in an engaging, game-like educational environment.",
              },
              {
                icon: <Layers className="w-6 h-6" />,
                title: "Blockchain Rewards",
                description:
                  "Earn EduTokens for completing tasks and receiving community validation on your learning journey.",
              },
              {
                icon: <LineChart className="w-6 h-6" />,
                title: "Progress Tracking",
                description:
                  "Monitor your educational growth with detailed analytics and blockchain-verified achievements.",
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "Personalized Tasks",
                description:
                  "Receive custom-tailored assignments that match your learning style and educational objectives.",
              },
              {
                icon: <ArrowRight className="w-6 h-6" />,
                title: "Decentralized Knowledge",
                description:
                  "Participate in a community-driven ecosystem that values and rewards knowledge sharing.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/10 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-300">{feature.description}</p>
              </div>
            ))} */}
          <HoverEffect className="" items={SECTION} />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How edu Sufle Works
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Our token-based economy incentivizes learning and knowledge
              sharing in a decentralized ecosystem.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-blue-500 hidden md:block"></div>

            <div className="space-y-24">
              {[
                {
                  title: "Ask Questions & Get Guidance",
                  description:
                    "Spend EduTokens to ask questions to Sufle AI and receive personalized guidance on your learning journey.",
                  image: "/sufle-bg-2.jpg",
                },
                {
                  title: "Complete Tasks & Share Progress",
                  description:
                    "Work through your personalized tasks and share your progress with the community through posts.",
                  image: "/sufle-bg-3.jpg",
                },
                {
                  title: "Earn Rewards & Recognition",
                  description:
                    "Gain likes on your progress posts to earn back EduTokens and receive recognition for your achievements.",
                  image: "/sufle-bg-1.jpg",
                },
              ].map((step, index) => (
                <div
                  key={index}
                  className="grid md:grid-cols-2 gap-8 items-center"
                >
                  <div
                    className={`space-y-4 ${
                      index % 2 === 1 ? "md:order-2" : ""
                    }`}
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-900 text-white font-bold text-xl border-4 border-slate-950 relative z-10">
                      {index + 1}
                    </div>
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                    <p className="text-slate-300">{step.description}</p>
                  </div>
                  <div
                    className={`relative ${
                      index % 2 === 1 ? "md:order-1" : ""
                    }`}
                  >
                    <div className="relative z-10 bg-slate-900/80 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 shadow-xl">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur opacity-20"></div>
                      <Image
                        src={step.image || "/placeholder.svg"}
                        width={500}
                        height={300}
                        alt={`Step ${index + 1}: ${step.title}`}
                        className="rounded-lg w-full h-auto"
                      />
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl blur-xl -z-10"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section
        id="technology"
        className="relative z-10 bg-slate-950/80 backdrop-blur-md py-24"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Cutting-Edge Technology Stack
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              edu Sufle is built on a robust foundation of blockchain and AI
              technologies.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Blockchain", description: "Solidity, Hardhat, ERC20" },
              {
                name: "Frontend",
                description: "Next.js, TailwindCSS, Shadcn UI",
              },
              {
                name: "AI Integration",
                description: "Gemini API for roadmap generation",
              },
              { name: "Backend", description: "MongoDB, custom APIs" },
              { name: "Token Economy", description: "SufleToken / EduToken" },
              { name: "Smart Contracts", description: "SufleTaskManager" },
              {
                name: "Survey System",
                description: "On-chain preference storage",
              },
              { name: "Social Features", description: "Community validation" },
            ].map((tech, index) => (
              <div
                key={index}
                className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/10"
              >
                <h3 className="text-lg font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">
                  {tech.name}
                </h3>
                <p className="text-sm text-slate-300">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="relative bg-gradient-to-br from-slate-900 to-purple-900/80 backdrop-blur-md rounded-2xl p-8 md:p-12 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>

            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Start Your Personalized Learning Journey Today
              </h2>
              <p className="text-lg text-slate-300 mb-8">
                Join edu Sufle and revolutionize the way you learn with
                AI-powered roadmaps and blockchain rewards.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {mounted && authState.isAuthenticated ? (
                  <Button
                    onClick={() => {
                      window.location.href = "/dashboard";
                    }}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-6 h-auto text-lg"
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <div className="relative">
                    <LoginButton />
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur opacity-30 animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950 border-t border-purple-900/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="relative w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">edu Sufle</span>
            </div>
            <div className="flex gap-8 mb-4 md:mb-0">
              <a
                href="#features"
                className="text-sm text-slate-300 hover:text-purple-300 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-slate-300 hover:text-purple-300 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#technology"
                className="text-sm text-slate-300 hover:text-purple-300 transition-colors"
              >
                Technology
              </a>
            </div>
            <div className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} edu Sufle. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
