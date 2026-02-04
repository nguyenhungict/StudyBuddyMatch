"use client"

export default function GlobalBackground() {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none hidden dark:block">
            {/* Primary Glow (Top Left) - Amber */}
            <div className="absolute top-[-15%] left-[-15%] w-[800px] h-[800px] bg-amber-500/15 rounded-full blur-[120px]" />

            {/* Secondary Glow (Bottom Right) - Orange */}
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-600/15 rounded-full blur-[100px]" />

            {/* Accent Glow (Center Right) - Subtle Red/Warm */}
            <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[80px]" />

            {/* Noise Texture for Premium Feel */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />
        </div>
    )
}
