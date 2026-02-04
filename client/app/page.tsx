"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, MessageSquare, Video, BookOpen, Heart, ArrowRight, Sparkles, Menu, X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function LandingPage() {
    const router = useRouter()
    const [isScrolled, setIsScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
        if (isLoggedIn) {
            router.push("/home")
        }

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [router])

    return (
        <div className="font-sans text-foreground selection:bg-amber-500 selection:text-black">

            {/* --- FIXED NAVBAR --- */}
            <nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
                    isScrolled
                        ? "bg-zinc-950/80 backdrop-blur-md py-4 shadow-lg border-b border-white/5"
                        : "bg-transparent py-6"
                )}
            >
                <div className="container mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/20 shadow-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">Study Buddy Match</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-zinc-300 hover:text-amber-400 transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-medium text-zinc-300 hover:text-amber-400 transition-colors">How it works</a>
                        <a href="#reviews" className="text-sm font-medium text-zinc-300 hover:text-amber-400 transition-colors">Stories</a>

                        <div className="flex items-center gap-4 ml-4">
                            <Link href="/login">
                                <span className="text-sm font-bold text-white hover:text-amber-400 cursor-pointer transition-colors">
                                    Log In
                                </span>
                            </Link>
                            <Link href="/signup">
                                <Button className="rounded-full bg-white text-black hover:bg-zinc-200 font-bold px-6">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-zinc-900 border-b border-zinc-800 p-4 md:hidden flex flex-col gap-4 shadow-2xl">
                        <a href="#features" className="text-zinc-300" onClick={() => setMobileMenuOpen(false)}>Features</a>
                        <a href="#how-it-works" className="text-zinc-300" onClick={() => setMobileMenuOpen(false)}>How it works</a>
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-white font-bold">Log In</Link>
                        <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                            <Button className="w-full bg-amber-500 text-black">Get Started</Button>
                        </Link>
                    </div>
                )}
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="relative min-h-screen flex items-center justify-center bg-zinc-950 overflow-hidden pt-20">

                {/* Abstract Background Shapes (Replicating the reference image style) */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Main Gradient Blob - Left */}
                    <div className="absolute top-0 left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-br from-amber-500/20 to-orange-600/10 rounded-full blur-[120px] animate-pulse" />
                    {/* Secondary Blob - Right */}
                    <div className="absolute bottom-0 right-[-10%] w-[50vw] h-[50vw] bg-gradient-to-tl from-yellow-500/10 to-transparent rounded-full blur-[100px]" />
                    {/* Accent Blob - Center Top */}
                    <div className="absolute top-[-10%] bg-zinc-800/50 w-full h-[50vh] blur-3xl" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span className="text-sm font-medium text-amber-200">#1 Study Application for Students</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-8 leading-[1.1]">
                        Find your perfect <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
                            Study Buddy
                        </span> today.
                    </h1>

                    <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Connect with students who match your learning style, schedule, and goals.
                        Stop studying alone and start achieving more together.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup">
                            <Button size="lg" className="h-14 px-8 rounded-full bg-amber-500 text-black hover:bg-amber-400 font-bold text-lg shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] transition-all hover:scale-105">
                                Join Now Free
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="#features">
                            <Button size="lg" variant="ghost" className="h-14 px-8 rounded-full text-white hover:bg-white/10 text-lg border border-white/10">
                                Explore Features
                            </Button>
                        </Link>
                    </div>

                    {/* Hero Image / Illustration Placeholder */}
                    <div className="mt-16 sm:mt-24 relative max-w-5xl mx-auto">
                        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-4 shadow-2xl">
                            {/* Mockup UI Window */}
                            <div className="rounded-lg bg-zinc-950 aspect-[16/9] relative overflow-hidden flex items-center justify-center border border-zinc-800 group">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950/90 z-10"></div>

                                {/* Abstract Grid Lines */}
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                                <div className="z-20 text-center p-8 transform transition-transform group-hover:scale-105 duration-700">
                                    <div className="w-20 h-20 bg-amber-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-amber-900/20">
                                        <Users className="w-10 h-10 text-zinc-950" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Smart Matching System</h3>
                                    <p className="text-zinc-400">Finding you the perfect partner in seconds</p>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -right-4 -top-8 bg-white text-zinc-950 p-4 rounded-xl shadow-xl transform rotate-6 animate-bounce delay-700 hidden md:block">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-full">
                                    <Heart className="w-5 h-5 text-green-600 fill-current" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm">It's a Match!</div>
                                    <div className="text-xs text-zinc-500">You & Sarah</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CONTENT SECTION (White Background) --- */}
            <section id="features" className="bg-white py-24 md:py-32 relative z-20">
                <div className="container mx-auto px-4">

                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <span className="text-amber-600 font-bold uppercase tracking-wider text-sm mb-4 block">Our Services</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-6">
                            Everything you need to <br /> excel in your studies
                        </h2>
                        <p className="text-lg text-zinc-500">
                            We provide a comprehensive ecosystem for students to collaborate, share knowledge, and grow together.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Feature 1 */}
                        <Card className="border-none shadow-none bg-zinc-50 hover:bg-white hover:shadow-xl transition-all duration-300 group">
                            <CardHeader className="p-8">
                                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                    <Users className="w-7 h-7" />
                                </div>
                                <CardTitle className="text-xl font-bold text-zinc-900 mb-3">Smart Matching</CardTitle>
                                <CardDescription className="text-zinc-500 text-base leading-relaxed">
                                    Find partners based on your specific subjects, learning style, and study schedule availability.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        {/* Feature 2 */}
                        <Card className="border-none shadow-none bg-zinc-50 hover:bg-white hover:shadow-xl transition-all duration-300 group">
                            <CardHeader className="p-8">
                                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <MessageSquare className="w-7 h-7" />
                                </div>
                                <CardTitle className="text-xl font-bold text-zinc-900 mb-3">Real-time Chat</CardTitle>
                                <CardDescription className="text-zinc-500 text-base leading-relaxed">
                                    Seamless instant messaging to coordinate sessions and share quick updates with your buddy.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        {/* Feature 3 */}
                        <Card className="border-none shadow-none bg-zinc-50 hover:bg-white hover:shadow-xl transition-all duration-300 group">
                            <CardHeader className="p-8">
                                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                    <Video className="w-7 h-7" />
                                </div>
                                <CardTitle className="text-xl font-bold text-zinc-900 mb-3">Video Calls</CardTitle>
                                <CardDescription className="text-zinc-500 text-base leading-relaxed">
                                    High-quality video study rooms for face-to-face collaboration and screen sharing.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        {/* Feature 4 */}
                        <Card className="border-none shadow-none bg-zinc-50 hover:bg-white hover:shadow-xl transition-all duration-300 group">
                            <CardHeader className="p-8">
                                <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mb-6 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                    <BookOpen className="w-7 h-7" />
                                </div>
                                <CardTitle className="text-xl font-bold text-zinc-900 mb-3">Resource Library</CardTitle>
                                <CardDescription className="text-zinc-500 text-base leading-relaxed">
                                    Share notes, summaries, and learning materials securely within your study network.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>

                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section id="how-it-works" className="py-24 bg-zinc-900 text-white relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-amber-500/5 rounded-full blur-3xl" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2">
                            <span className="text-amber-500 font-bold uppercase tracking-wider text-sm mb-4 block">Workflow</span>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                                Simple process to <br /> start learning
                            </h2>
                            <p className="text-zinc-400 text-lg mb-8 max-w-lg">
                                We've streamlined the entire process so you can focus on what matters most - your education.
                            </p>

                            <div className="space-y-8">
                                {[
                                    { title: "Create Profile", desc: "Set up your academic profile and preferences." },
                                    { title: "Get Matched", desc: "Our AI algorithm finds your ideal study partners." },
                                    { title: "Connect & Study", desc: "Start chatting and learning together immediately." }
                                ].map((step, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-amber-500">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                                            <p className="text-zinc-500">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="md:w-1/2 relative">
                            <div className="relative z-10 bg-zinc-800 rounded-3xl p-2 shadow-2xl skew-y-3 transform hover:skew-y-0 transition-transform duration-500">
                                <img
                                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                    alt="Students studying"
                                    className="rounded-2xl w-full h-auto opacity-80"
                                />
                            </div>
                            <div className="absolute -inset-4 bg-amber-500/20 rounded-[2rem] blur-xl -z-10"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-black text-zinc-500 py-12 border-t border-zinc-900">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-6 text-white">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        <span className="text-lg font-bold">Study Buddy Match</span>
                    </div>
                    <div className="flex justify-center gap-8 mb-8 text-sm">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Contact Support</a>
                    </div>
                    <p className="text-sm">© 2026 Study Buddy Match. Built for students, by students.</p>
                </div>
            </footer>
        </div>
    )
}
