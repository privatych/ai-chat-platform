import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">AI Chat Platform</h1>
      <p className="text-gray-600 mb-8">Chat with 20+ AI models</p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
        <Link href="/register">
          <Button variant="outline">Sign Up</Button>
        </Link>
      </div>
    </main>
  );
}
