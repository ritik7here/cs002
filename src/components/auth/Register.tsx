// import React, { useState } from 'react';
// import { Heart, Building2, ArrowRight, UserCheck } from 'lucide-react';
// import { useApp } from '../../context/AppContext';
// import { UserRole } from '../../types';

// export const Register: React.FC = () => {
//   const { register, setCurrentView } = useApp();
//   const [role, setRole] = useState<UserRole>('donor');
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [phone, setPhone] = useState('');
//   const [location, setLocation] = useState('Mumbai, Maharashtra');
//   const [orgName, setOrgName] = useState('');

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!name || !email) return;

//     register({
//       name,
//       email,
//       role,
//       phone,
//       location,
//       orgName: role === 'ngo' ? orgName || `${name}'s Community Trust` : undefined,
//     });
//   };

//   return (
//     <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
//       <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
//         <div className="text-center space-y-2">
//           <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
//             Create KindredBridge Account
//           </h2>
//           <p className="text-xs text-neutral-500 dark:text-neutral-400">
//             Join the auditable community management platform
//           </p>
//         </div>

//         {/* Role Selection Cards */}
//         <div className="grid grid-cols-2 gap-3">
//           <button
//             type="button"
//             onClick={() => setRole('donor')}
//             className={`p-4 rounded-xl border text-left transition-all ${
//               role === 'donor'
//                 ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-xs'
//                 : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
//             }`}
//           >
//             <Heart className={`w-5 h-5 mb-2 ${role === 'donor' ? 'text-emerald-600' : 'text-neutral-400'}`} />
//             <div className="font-semibold text-xs text-neutral-900 dark:text-white">Donor / Sponsor</div>
//             <div className="text-[11px] text-neutral-500 mt-0.5">
//               Pledge goods, medical kits, food, or funds
//             </div>
//           </button>

//           <button
//             type="button"
//             onClick={() => setRole('ngo')}
//             className={`p-4 rounded-xl border text-left transition-all ${
//               role === 'ngo'
//                 ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs'
//                 : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
//             }`}
//           >
//             <Building2 className={`w-5 h-5 mb-2 ${role === 'ngo' ? 'text-blue-600' : 'text-neutral-400'}`} />
//             <div className="font-semibold text-xs text-neutral-900 dark:text-white">NGO Representative</div>
//             <div className="text-[11px] text-neutral-500 mt-0.5">
//               Post community needs & receive verified aid
//             </div>
//           </button>
//         </div>

//         {/* Form fields */}
//         <form onSubmit={handleSubmit} className="space-y-4 text-xs">
//           {role === 'ngo' && (
//             <div>
//               <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
//                 Non-Profit / NGO Organization Name
//               </label>
//               <input
//                 type="text"
//                 required
//                 value={orgName}
//                 onChange={e => setOrgName(e.target.value)}
//                 placeholder="e.g. Hope Horizon Welfare Society"
//                 className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
//               />
//             </div>
//           )}

//           <div>
//             <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
//               {role === 'ngo' ? 'Authorized Representative Name' : 'Full Name or Corporate Entity'}
//             </label>
//             <input
//               type="text"
//               required
//               value={name}
//               onChange={e => setName(e.target.value)}
//               placeholder="e.g. Priya Sharma"
//               className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
//             />
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//             <div>
//               <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
//                 Official Email Address
//               </label>
//               <input
//                 type="email"
//                 required
//                 value={email}
//                 onChange={e => setEmail(e.target.value)}
//                 placeholder="name@organization.org"
//                 className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
//               />
//             </div>
//             <div>
//               <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
//                 Contact Phone / WhatsApp
//               </label>
//               <input
//                 type="tel"
//                 value={phone}
//                 onChange={e => setPhone(e.target.value)}
//                 placeholder="+91 98765 43210"
//                 className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
//               Base Location / City
//             </label>
//             <input
//               type="text"
//               required
//               value={location}
//               onChange={e => setLocation(e.target.value)}
//               className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
//             />
//           </div>

//           <button
//             type="submit"
//             className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
//           >
//             <span>Complete Registration</span>
//             <ArrowRight className="w-4 h-4" />
//           </button>
//         </form>

//         <div className="text-center text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800">
//           Already registered?{' '}
//           <button
//             onClick={() => setCurrentView('auth-login')}
//             className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
//           >
//             Sign in here
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };
import React, { useState } from "react";
import { Heart, Building2, ArrowRight, UserCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { UserRole } from "../../types";

export const Register: React.FC = () => {
  const { register, setCurrentView } = useApp();
  const [role, setRole] = useState<UserRole>("donor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("Mumbai, Maharashtra");
  const [orgName, setOrgName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || password.length < 8) return;
    setIsSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        phone,
        location,
        orgName: role === "ngo" ? orgName : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Create KindredBridge Account
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Join the auditable community management platform
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("donor")}
            className={`p-4 rounded-xl border text-left transition-all ${
              role === "donor"
                ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-xs"
                : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
            }`}
          >
            <Heart
              className={`w-5 h-5 mb-2 ${role === "donor" ? "text-emerald-600" : "text-neutral-400"}`}
            />
            <div className="font-semibold text-xs text-neutral-900 dark:text-white">
              Donor / Sponsor
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Pledge goods, medical kits, food, or funds
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRole("ngo")}
            className={`p-4 rounded-xl border text-left transition-all ${
              role === "ngo"
                ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs"
                : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
            }`}
          >
            <Building2
              className={`w-5 h-5 mb-2 ${role === "ngo" ? "text-blue-600" : "text-neutral-400"}`}
            />
            <div className="font-semibold text-xs text-neutral-900 dark:text-white">
              NGO Representative
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Post community needs & receive verified aid
            </div>
          </button>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {role === "ngo" && (
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Non-Profit / NGO Organization Name
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Hope Horizon Welfare Society"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {role === "ngo"
                ? "Authorized Representative Name"
                : "Full Name or Corporate Entity"}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Password (at least 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Contact Phone / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Base Location / City
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <span>
              {isSubmitting ? "Creating account…" : "Complete Registration"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          Already registered?{" "}
          <button
            onClick={() => setCurrentView("auth-login")}
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
};
