import { UserPlus, Users, X, Check } from "lucide-react"

export default function SocialPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Social</h1>

      <div className="space-y-8">
        {/* Friend Requests */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Friend Requests
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <span className="font-bold">S{i}</span>
                  </div>
                  <div>
                    <p className="font-medium">Student {i}</p>
                    <p className="text-xs text-muted-foreground">2 mutual friends</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                    <Check className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Friends List */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            My Friends
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-border bg-card flex flex-col items-center text-center"
              >
                <div className="h-16 w-16 rounded-full bg-secondary mb-3 flex items-center justify-center">
                  <span className="text-xl font-bold">F{i}</span>
                </div>
                <h3 className="font-medium mb-1">Friend {i}</h3>
                <p className="text-xs text-muted-foreground mb-3">Grade 11 • Math, Physics</p>
                <button className="w-full py-2 rounded-md bg-secondary text-sm font-medium hover:bg-secondary/80">
                  Message
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
