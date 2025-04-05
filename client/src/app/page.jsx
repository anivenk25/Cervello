import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)] bg-[#0a0e17] text-white">
      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center bg-[#111827] border-b border-[#2d3748]">
        <div className="text-2xl font-bold text-[#3b82f6]">Q&A Assistant</div>
        <div className="flex items-center gap-4">
          <Link 
            href="/auth/login"
            className="rounded-full border border-solid border-[#3b82f6]/30 px-4 py-2 text-sm font-medium hover:bg-[#1e293b] transition-colors"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="rounded-full border border-solid border-transparent px-4 py-2 text-sm font-medium bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 p-4 sm:p-8 lg:p-20 items-center bg-gradient-to-br from-[#0a0e17] to-[#111827]">
        <div className="flex flex-col gap-6 order-2 md:order-1">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center md:text-left">
            Real-time <span className="text-[#3b82f6]">Q&A</span> Assistant
          </h1>
          <p className="text-base sm:text-lg text-white/70 text-center md:text-left">
            Get instant answers to your questions using the latest information from multiple data streams. Our AI-powered assistant stays up-to-date with continuous data ingestion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link 
              href="/qa"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-[#3b82f6] text-white gap-2 hover:bg-[#2563eb] font-medium text-sm sm:text-base h-12 px-6 w-full sm:w-auto"
            >
              Try It Now
            </Link>
            <Link 
              href="/auth/register"
              className="rounded-full border border-solid border-[#3b82f6]/30 transition-colors flex items-center justify-center hover:bg-[#1e293b] font-medium text-sm sm:text-base h-12 px-6 w-full sm:w-auto"
            >
              Create Account
            </Link>
          </div>
        </div>
        <div className="relative flex justify-center order-1 md:order-2 mb-4 md:mb-0">
          <div className="w-full max-w-lg p-4 sm:p-6 rounded-xl border border-[#2d3748] bg-[#111827]/90 backdrop-blur shadow-lg shadow-[#3b82f6]/10">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="space-y-4">
              <div className="bg-[#1e293b] p-3 rounded-lg border-l-4 border-[#3b82f6]">
                <p className="text-white/90 text-sm sm:text-base">What are the key features of Pathway's streaming platform?</p>
              </div>
              <div className="flex justify-end">
                <div className="bg-[#0f172a] p-3 rounded-lg max-w-xs border-r-4 border-[#3b82f6]">
                  <p className="text-white/90 text-sm sm:text-base">Pathway's streaming platform offers real-time data ingestion, continuous indexing, and vectorization for up-to-date RAG applications.</p>
                </div>
              </div>
            </div>
            <div className="flex items-center mt-6">
              <input 
                type="text" 
                placeholder="Ask anything..."
                className="flex-1 border border-[#2d3748] rounded-full py-2 sm:py-3 px-3 sm:px-4 bg-[#1e293b] text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
              />
              <button className="ml-2 rounded-full p-2 sm:p-3 bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 lg:px-20 border-t border-[#2d3748] bg-[#111827]">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-white"><span className="text-[#3b82f6]">Key</span> Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="p-4 sm:p-6 border border-[#2d3748] bg-[#0a0e17] rounded-xl hover:shadow-lg hover:shadow-[#3b82f6]/10 hover:border-[#3b82f6]/30 transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1e293b] text-[#3b82f6] rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">Real-time Updates</h3>
            <p className="text-sm sm:text-base text-white/70">Our system continuously ingests and indexes new data, ensuring answers are based on the latest information.</p>
          </div>
          <div className="p-4 sm:p-6 border border-[#2d3748] bg-[#0a0e17] rounded-xl hover:shadow-lg hover:shadow-[#3b82f6]/10 hover:border-[#3b82f6]/30 transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1e293b] text-[#3b82f6] rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">Accurate Answers</h3>
            <p className="text-sm sm:text-base text-white/70">Our RAG technology provides answers grounded in factual data with transparent source references.</p>
          </div>
          <div className="p-4 sm:p-6 border border-[#2d3748] bg-[#0a0e17] rounded-xl hover:shadow-lg hover:shadow-[#3b82f6]/10 hover:border-[#3b82f6]/30 transition-all sm:col-span-2 lg:col-span-1 sm:max-w-md lg:max-w-none mx-auto sm:mx-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1e293b] text-[#3b82f6] rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">Personalized Experience</h3>
            <p className="text-sm sm:text-base text-white/70">Tailored responses based on your role, whether you're a developer or teacher, for the most relevant information.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-8 sm:px-20 bg-[#3b82f6] bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-white/90 mb-8">Sign up now and experience the power of real-time Q&A</p>
          <Link 
            href="/auth/register"
            className="rounded-full border border-solid border-white/30 bg-white/10 hover:bg-white/20 transition-colors py-3 px-8 font-medium inline-block"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 sm:px-20 border-t border-[#2d3748] bg-[#0a0e17]">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="text-xl font-bold text-[#3b82f6]">Q&A Assistant</div>
            <p className="text-white/60 mt-1">Powered by Pathway's streaming platform</p>
          </div>
          <div className="flex gap-6">
            <Link href="/about" className="text-white/70 hover:text-[#3b82f6] hover:underline hover:underline-offset-4 transition">About</Link>
            <Link href="/privacy" className="text-white/70 hover:text-[#3b82f6] hover:underline hover:underline-offset-4 transition">Privacy</Link>
            <Link href="/terms" className="text-white/70 hover:text-[#3b82f6] hover:underline hover:underline-offset-4 transition">Terms</Link>
            <Link href="/contact" className="text-white/70 hover:text-[#3b82f6] hover:underline hover:underline-offset-4 transition">Contact</Link>
          </div>
        </div>
        <div className="border-t border-[#2d3748] mt-8 pt-6 text-center text-white/60">
          <p>&copy; {new Date().getFullYear()} Q&A Assistant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}