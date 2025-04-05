import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center">
        <div className="text-2xl font-bold">Q&A Assistant</div>
        <div className="flex items-center gap-4">
          <Link 
            href="/auth/login"
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] px-4 py-2 text-sm font-medium hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] transition-colors"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="rounded-full border border-solid border-transparent px-4 py-2 text-sm font-medium bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 sm:p-20 items-center">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-bold">
            Real-time Q&A Assistant
          </h1>
          <p className="text-lg opacity-80">
            Get instant answers to your questions using the latest information from multiple data streams. Our AI-powered assistant stays up-to-date with continuous data ingestion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/qa"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-12 px-6"
            >
              Try It Now
            </Link>
            <Link 
              href="/auth/register"
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-12 px-6"
            >
              Create Account
            </Link>
          </div>
        </div>
        <div className="relative flex justify-center">
          <div className="w-full max-w-lg p-6 rounded-xl border border-black/[.06] dark:border-white/[.08] bg-white/80 dark:bg-black/80 backdrop-blur shadow-lg">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="space-y-4">
              <div className="bg-[#f2f2f2] dark:bg-[#1a1a1a] p-3 rounded-lg">
                <p>What are the key features of Pathway's streaming platform?</p>
              </div>
              <div className="flex justify-end">
                <div className="bg-[#f0f7ff] dark:bg-[#0a192f] p-3 rounded-lg max-w-xs">
                  <p>Pathway's streaming platform offers real-time data ingestion, continuous indexing, and vectorization for up-to-date RAG applications.</p>
                </div>
              </div>
            </div>
            <div className="flex items-center mt-6">
              <input 
                type="text" 
                placeholder="Ask anything..."
                className="flex-1 border border-black/[.08] dark:border-white/[.145] rounded-full py-3 px-4 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#383838] dark:focus:ring-[#ccc]"
              />
              <button className="ml-2 rounded-full p-3 bg-foreground text-background">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-16 px-8 sm:px-20 border-t border-black/[.06] dark:border-white/[.08]">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border border-black/[.06] dark:border-white/[.08] rounded-xl hover:shadow-lg transition">
            <div className="w-12 h-12 bg-[#f0f7ff] dark:bg-[#0a192f] rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
            <p className="opacity-80">Our system continuously ingests and indexes new data, ensuring answers are based on the latest information.</p>
          </div>
          <div className="p-6 border border-black/[.06] dark:border-white/[.08] rounded-xl hover:shadow-lg transition">
            <div className="w-12 h-12 bg-[#f0f7ff] dark:bg-[#0a192f] rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Accurate Answers</h3>
            <p className="opacity-80">Our RAG technology provides answers grounded in factual data with transparent source references.</p>
          </div>
          <div className="p-6 border border-black/[.06] dark:border-white/[.08] rounded-xl hover:shadow-lg transition">
            <div className="w-12 h-12 bg-[#f0f7ff] dark:bg-[#0a192f] rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Personalized Experience</h3>
            <p className="opacity-80">Tailored responses based on your role, whether you're a developer or teacher, for the most relevant information.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-8 sm:px-20 bg-foreground text-background">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl opacity-90 mb-8">Sign up now and experience the power of real-time Q&A</p>
          <Link 
            href="/auth/register"
            className="rounded-full border border-solid border-white/20 bg-white/10 hover:bg-white/20 transition-colors py-3 px-8 font-medium inline-block"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 sm:px-20 border-t border-black/[.06] dark:border-white/[.08]">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="text-xl font-bold">Q&A Assistant</div>
            <p className="opacity-60 mt-1">Powered by Pathway's streaming platform</p>
          </div>
          <div className="flex gap-6">
            <Link href="/about" className="hover:underline hover:underline-offset-4 transition">About</Link>
            <Link href="/privacy" className="hover:underline hover:underline-offset-4 transition">Privacy</Link>
            <Link href="/terms" className="hover:underline hover:underline-offset-4 transition">Terms</Link>
            <Link href="/contact" className="hover:underline hover:underline-offset-4 transition">Contact</Link>
          </div>
        </div>
        <div className="border-t border-black/[.06] dark:border-white/[.08] mt-8 pt-6 text-center opacity-60">
          <p>&copy; {new Date().getFullYear()} Q&A Assistant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}