import Link from "next/link"
import { Clock, Github, Twitter, Globe } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">TimeCapsule</h3>
                <p className="text-xs text-slate-500">Aptos Blockchain</p>
              </div>
            </div>
            <p className="text-slate-600 text-sm max-w-md">
              Create and manage digital time capsules on the Aptos blockchain. Preserve your memories and messages for
              the future with cryptographic security and decentralized storage.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/create" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Create Capsule
                </Link>
              </li>
              <li>
                <Link href="/capsules" className="text-slate-600 hover:text-blue-600 transition-colors">
                  My Capsules
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://aptos.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Aptos Docs
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Source Code
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Help & Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © 2024 TimeCapsule. Built on Aptos blockchain for secure, decentralized time capsules.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </a>
            <a
              href="https://aptos.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Globe className="h-5 w-5" />
              <span className="sr-only">Aptos</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
