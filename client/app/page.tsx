import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ArrowRight, BookOpen, Users, Award, BarChart2, Github, Twitter, Linkedin, Facebook } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Sufle</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link href="#testimonials" className="text-sm font-medium hover:text-primary">
              Success Stories
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
            <Link href="#" className="text-sm font-medium hover:text-primary">
              Community
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4 hidden sm:inline-block">
              Sign In
            </Link>
            <Button asChild>
              <Link href="#" className="font-medium">
                Join Now
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <Badge className="inline-flex rounded-md px-3 py-1 text-sm">Learning Community</Badge>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Learn Better Together, Achieve More
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Share your learning journey, track completed tasks, and connect with fellow learners in a supportive community.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="#" className="font-medium">
                      Start Learning
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="#" className="font-medium">
                      Explore Community
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="/placeholder.svg?height=550&width=550"
                width={550}
                height={550}
                alt="Students collaborating"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">How Sufle Works</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Our platform makes learning social, accountable, and more effective through shared progress.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-4">
              <Card className="flex flex-col items-center space-y-2 p-6 text-center">
                <BookOpen className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Task Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  Create and share learning tasks with your community or study groups.
                </p>
              </Card>
              <Card className="flex flex-col items-center space-y-2 p-6 text-center">
                <BarChart2 className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Progress Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize your learning journey with detailed progress analytics.
                </p>
              </Card>
              <Card className="flex flex-col items-center space-y-2 p-6 text-center">
                <Users className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Community Support</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with peers, give feedback, and celebrate each other's achievements.
                </p>
              </Card>
              <Card className="flex flex-col items-center space-y-2 p-6 text-center">
                <Award className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Achievement System</h3>
                <p className="text-sm text-muted-foreground">
                  Earn badges and rewards as you complete tasks and help others learn.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Success Stories from Our Community
                </h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  See how Sufle has transformed learning experiences for students worldwide.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <Card className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-4">
                    <Image
                      src="/placeholder.svg?height=40&width=40"
                      width={40}
                      height={40}
                      alt="Student Avatar"
                      className="rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium">Alex Rivera</p>
                      <p className="text-xs text-muted-foreground">Computer Science Student</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    "Sufle helped me stay accountable while learning to code. Sharing my daily programming tasks with others motivated me to complete them consistently."
                  </p>
                  <div className="flex text-primary">
                    <CheckCircle className="h-4 w-4" />
                    <CheckCircle className="h-4 w-4" />
                    <CheckCircle className="h-4 w-4" />
                    <CheckCircle className="h-4 w-4" />
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-4">
                    <Image
                      src="/placeholder.svg?height=40&width=40"
                      width={40}
                      height={40}
                      alt="Student Avatar"
                      className="rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium">Priya Sharma</p>
                      <p className="text-xs text-muted-foreground">Medical Student</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    "The community support is incredible. When I was struggling with anatomy, other med students shared their study techniques and resources that helped me pass my exams."
                  </p>
                  <div className="flex text-primary">
                    <CheckCircle className="h-4 w-4" />
                    <CheckCircle className="h-4 w-4" />
                    <CheckCircle className="h-4 w-4" />
                    <CheckCircle className="h-4 w-4" />
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-4">
                    <Image
                      src="/placeholder.svg?height=40&width=40"
                      width={40}
                      height={40}
                      alt="Teacher Avatar"
                      className="rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium">Marcus Johnson</p>
                      <p className="text-xs text-muted-foreground">High School Teacher</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    "I use Sufle with my students to create collaborative learning projects. The task sharing feature has increased engagement and improved completion rates."
                  </p>
                  <div className="flex text-primary">
                    <CheckCircle className="h-4 w-4" />
                    <CheckCircle className="h-4 w-4" />
                    <CheckCircle className="h-4 w-4" />
                    <CheckCircle className="h-4 w-4" />
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Plans for Every Learner</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Choose the plan that fits your learning journey. All plans include a 14-day free trial.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-3">
              <Card className="flex flex-col p-6">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-2xl font-bold">Basic</h3>
                  <p className="text-muted-foreground">For individual learners</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">Free</span>
                    <span className="text-muted-foreground">forever</span>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Create up to 10 tasks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Join 3 study groups</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Basic progress tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Community support</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-auto pt-6">
                  <Button className="w-full" variant="outline">
                    Sign Up Free
                  </Button>
                </div>
              </Card>
              <Card className="flex flex-col p-6 border-primary">
                <div className="flex flex-col space-y-2">
                  <Badge className="w-fit">Popular</Badge>
                  <h3 className="text-2xl font-bold">Student</h3>
                  <p className="text-muted-foreground">For dedicated learners</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">$9</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Unlimited tasks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Join unlimited study groups</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Advanced analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Priority support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Study resource library</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-auto pt-6">
                  <Button className="w-full">
                    Start Free Trial
                  </Button>
                </div>
              </Card>
              <Card className="flex flex-col p-6">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-2xl font-bold">Educator</h3>
                  <p className="text-muted-foreground">For teachers and institutions</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">$19</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Everything in Student plan</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Create classes & assignments</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Student performance insights</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Integration with LMS</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">Dedicated account manager</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-auto pt-6">
                  <Button className="w-full" variant="outline">
                    Contact Education Team
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Ready to Transform Your Learning Journey?
                </h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Join thousands of students already using Sufle to achieve their educational goals faster.
                </p>
              </div>
              <div className="mx-auto w-full max-w-sm space-y-2">
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                  <Button size="lg" asChild>
                    <Link href="#" className="font-medium">
                      Join Our Community <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg">
                    See How It Works
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  No credit card required for free plan. Start learning together today.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Sufle</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <nav className="flex gap-4 md:gap-6">
              <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:underline underline-offset-4">
                Terms
              </Link>
              <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:underline underline-offset-4">
                Privacy
              </Link>
              <Link href="#" className="text-xs md:text-sm text-muted-foreground hover:underline underline-offset-4">
                Help Center
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Linkedin className="h-4 w-4" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Facebook className="h-4 w-4" />
                <span className="sr-only">Facebook</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
