import { useNavigate } from "react-router-dom"; 
import { Building2, ListChecks, Trash2 } from "lucide-react";


export default function LandingScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-rose-500 animate-pulse"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-6xl relative z-10">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/30 transform transition-transform duration-500 hover:scale-105">
            <Building2 className="text-white" size={36} />
          </div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
            Restaurant Management System
          </h1>

          <div className="inline-flex items-center px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700/50 mb-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
            <p className="text-lg text-slate-300">
              Enterprise Multi-Tenant Platform
            </p>
          </div>
          
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Contactless QR-Based Ordering & Billing Platform
            <span className="block text-sm mt-2 text-slate-500">
              Secure • Scalable • Compliant
            </span>
          </p>
        </div>

        {/* Enhanced Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Create Company Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
            <div className="relative bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/90 transition-all duration-300 group-hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:from-indigo-500/30 group-hover:to-indigo-600/30 transition-all duration-300 border border-indigo-500/20">
                  <Building2
                    className="text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300"
                    size={32}
                  />
                </div>

                <h3 className="text-2xl font-semibold mb-3 text-white">
                  Create Company
                </h3>

                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  Set up a new restaurant or business entity with isolated tenant environment, dedicated resources, and custom configuration.
                </p>

                <button
                 onClick={() => navigate("/login")}

                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95 group-hover:shadow-indigo-500/20"
                >
                  <span className="flex items-center justify-center">
                    Provision Tenant
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </div>
              
              {/* Card footer */}
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Schema Isolation</span>
                  <span>Auto-Scaling</span>
                  <span>Custom Domain</span>
                </div>
              </div>
            </div>
          </div>

          {/* Select Company Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
            <div className="relative bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/90 transition-all duration-300 group-hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:from-emerald-500/30 group-hover:to-emerald-600/30 transition-all duration-300 border border-emerald-500/20">
                  <ListChecks
                    className="text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300"
                    size={32}
                  />
                </div>

                <h3 className="text-2xl font-semibold mb-3 text-white">
                  Select Company
                </h3>

                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  Access an existing restaurant account with role-based permissions, cross-tenant analytics, and centralized dashboard.
                </p>

                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95 group-hover:shadow-emerald-500/20"
                >
                  <span className="flex items-center justify-center">
                    Access Tenant
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </div>
              
              {/* Card footer */}
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>RBAC</span>
                  <span>Analytics</span>
                  <span>Audit Logs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Company Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
            <div className="relative bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/90 transition-all duration-300 group-hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-500/10">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-rose-500/20 to-rose-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:from-rose-500/30 group-hover:to-rose-600/30 transition-all duration-300 border border-rose-500/20">
                  <Trash2
                    className="text-rose-400 group-hover:text-rose-300 transition-colors duration-300"
                    size={32}
                  />
                </div>

                <h3 className="text-2xl font-semibold mb-3 text-white">
                  Delete Company
                </h3>

                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  Remove a restaurant from the system with compliance logging, data archival, and GDPR-compliant deletion procedures.
                </p>

                <button
                  onClick={() => alert("Delete company coming soon")}
                  className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/25 active:scale-95 group-hover:shadow-rose-500/20"
                >
                  <span className="flex items-center justify-center">
                    Manage Lifecycle
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </div>
              
              {/* Card footer */}
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>GDPR Ready</span>
                  <span>Data Backup</span>
                  <span>Admin Only</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-6 mb-6">
            <div className="flex items-center text-slate-400 text-sm">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
              Multi-tenant SaaS Architecture
            </div>
            <div className="flex items-center text-slate-400 text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
              Role-Based Access Control
            </div>
            <div className="flex items-center text-slate-400 text-sm">
              <div className="w-2 h-2 bg-rose-500 rounded-full mr-2"></div>
              ISO 27001 Certified
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-xl p-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-white mb-1">99.9%</div>
                <div className="text-xs text-slate-400">Uptime SLA</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">256-bit</div>
                <div className="text-xs text-slate-400">Encryption</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">24/7</div>
                <div className="text-xs text-slate-400">Support</div>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 mt-6 pt-6 border-t border-slate-700/30">
              © 2024 Restaurant Management Platform • Enterprise Multi-Tenant Solution • 
              <span className="text-slate-400 ml-1">v2.1.0</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}