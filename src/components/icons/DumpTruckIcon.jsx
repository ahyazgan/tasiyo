import { motion } from "framer-motion";

export default function DumpTruckIcon({ size = 48, className = "" }) {
  // Orange theme gradient details
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="initial"
      whileHover="hover"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Sleek metallic orange gradient for the dumper body */}
        <linearGradient id="dumperGrad" x1="16" y1="18" x2="48" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF8343" />
          <stop offset="60%" stopColor="#F15A24" />
          <stop offset="100%" stopColor="#C85A24" />
        </linearGradient>
        {/* Cab color gradient */}
        <linearGradient id="cabGrad" x1="4" y1="24" x2="20" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4B5563" />
          <stop offset="100%" stopColor="#1F2937" />
        </linearGradient>
        {/* Dirt pile gradient */}
        <linearGradient id="dirtGrad" x1="16" y1="18" x2="40" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#87533B" />
          <stop offset="100%" stopColor="#5C3421" />
        </linearGradient>
        {/* Glow filter for headlights */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ground Shadow */}
      <ellipse cx="32" cy="53" rx="22" ry="2.5" fill="#000" opacity="0.12" />

      {/* Main Truck Frame Group (suspension bounce) */}
      <motion.g
        variants={{
          hover: { y: [0, -1, 0.5, 0], transition: { duration: 0.4 } }
        }}
      >
        {/* Chassis Rail */}
        <rect x="12" y="43" width="38" height="4" rx="1.5" fill="#374151" />
        <rect x="42" y="40" width="6" height="4" rx="1" fill="#4B5563" />
        
        {/* Cabin Assembly (Front Right in truck perspective, let's make the truck face left) */}
        <g>
          {/* Cab Main Body */}
          <path d="M6 44V26C6 24.8954 6.89543 24 8 24H20C21.1046 24 22 24.8954 22 26V44H6Z" fill="url(#cabGrad)" />
          
          {/* Cab Window */}
          <path d="M8 26H16C17 26 17.5 26.5 17.5 27.5V33H8V26Z" fill="#93C5FD" opacity="0.85" />
          
          {/* Grill details */}
          <rect x="6" y="36" width="3" height="6" rx="0.5" fill="#111827" />
          <line x1="10" y1="36" x2="16" y2="36" stroke="#111827" strokeWidth="1.5" />
          <line x1="10" y1="39" x2="16" y2="39" stroke="#111827" strokeWidth="1.5" />
          
          {/* Headlight with animated glow */}
          <motion.circle
            cx="5"
            cy="39"
            r="1.5"
            fill="#FBBF24"
            variants={{
              hover: {
                scale: 1.3,
                fill: "#FFF5D1",
                filter: "url(#glow)",
                transition: { duration: 0.2 }
              }
            }}
          />
          
          {/* Side Mirror */}
          <rect x="18" y="27" width="1.5" height="5" rx="0.5" fill="#1F2937" />
          <line x1="16.5" y1="29.5" x2="18" y2="29.5" stroke="#1F2937" strokeWidth="1" />
        </g>

        {/* Dumper Hinge Hanger */}
        <circle cx="46" cy="43" r="2" fill="#1F2937" />

        {/* Tilted Cargo Bed Group (Rotates on rear hinge at (46, 43)) */}
        <motion.g
          style={{ transformOrigin: "46px 43px" }}
          variants={{
            hover: {
              rotate: -15,
              transition: { type: "spring", stiffness: 100, damping: 10 }
            }
          }}
        >
          {/* Load / Dirt pile inside the bed */}
          <path d="M22 22C24 16 38 16 45 22Z" fill="url(#dirtGrad)" />
          
          {/* Cargo Bed Container */}
          <path
            d="M21 22H47C48.5 22 49 23 49 25L47.5 41C47.3 42 46.5 42.5 45.5 42.5H22.5C21.5 42.5 20.7 42 20.5 41L19 25C19 23 19.5 22 21 22Z"
            fill="url(#dumperGrad)"
            stroke="#C85A24"
            strokeWidth="1"
          />

          {/* Dumper side ribs for premium industrial look */}
          <path d="M25 24L26.5 40" stroke="#A73A0F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M31 24L32.5 40" stroke="#A73A0F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M37 24L38.5 40" stroke="#A73A0F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M43 24L44.5 40" stroke="#A73A0F" strokeWidth="2.5" strokeLinecap="round" />

          {/* Tailgate highlight */}
          <path d="M47.5 22.5L46 41" stroke="#FFAD84" strokeWidth="1.5" opacity="0.4" />
        </motion.g>

        {/* Falling Debris Particles (Animate on hover) */}
        {/* Particle 1 */}
        <motion.circle
          cx="49"
          cy="28"
          r="2.5"
          fill="#87533B"
          initial={{ opacity: 0, x: 0, y: 0 }}
          variants={{
            hover: {
              opacity: [0, 1, 1, 0],
              x: [0, 4, 8, 12],
              y: [0, 6, 15, 24],
              scale: [0.7, 1.1, 0.9, 0.4],
              transition: { duration: 0.8, ease: "easeOut", repeat: Infinity, repeatDelay: 0.2 }
            }
          }}
        />
        {/* Particle 2 */}
        <motion.circle
          cx="48"
          cy="31"
          r="1.8"
          fill="#5C3421"
          initial={{ opacity: 0, x: 0, y: 0 }}
          variants={{
            hover: {
              opacity: [0, 0, 1, 1, 0],
              x: [0, 3, 6, 9],
              y: [0, 2, 10, 20],
              scale: [0.5, 0.8, 1.2, 0.6, 0.3],
              transition: { duration: 0.7, ease: "easeOut", delay: 0.25, repeat: Infinity, repeatDelay: 0.3 }
            }
          }}
        />
        {/* Particle 3 (Dust Cloudlet) */}
        <motion.path
          d="M 48 34 Q 50 36 49 38 Q 47 39 46 37 Z"
          fill="#A78B7E"
          opacity={0}
          variants={{
            hover: {
              opacity: [0, 0.7, 0.4, 0],
              x: [0, 5, 8],
              y: [0, 8, 16],
              scale: [0.5, 1.2, 1.8, 2.2],
              transition: { duration: 0.9, ease: "easeOut", delay: 0.1, repeat: Infinity, repeatDelay: 0.1 }
            }
          }}
        />

        {/* Wheels (Spin/Roll on Hover) */}
        {/* Front Wheel */}
        <g>
          <motion.g
            style={{ transformOrigin: "17px 47px" }}
            variants={{
              hover: { rotate: 360, transition: { duration: 1.5, ease: "linear", repeat: Infinity } }
            }}
          >
            {/* Tyre */}
            <circle cx="17" cy="47" r="5.5" fill="#111827" stroke="#374151" strokeWidth="1" />
            {/* Hubcap & Rim Details */}
            <circle cx="17" cy="47" r="2.5" fill="#9CA3AF" />
            <circle cx="17" cy="47" r="0.8" fill="#4B5563" />
            <line x1="17" y1="44.5" x2="17" y2="49.5" stroke="#4B5563" strokeWidth="0.8" />
            <line x1="14.5" y1="47" x2="19.5" y2="47" stroke="#4B5563" strokeWidth="0.8" />
          </motion.g>
        </g>

        {/* Rear Wheel 1 */}
        <g>
          <motion.g
            style={{ transformOrigin: "35px 47px" }}
            variants={{
              hover: { rotate: 360, transition: { duration: 1.5, ease: "linear", repeat: Infinity } }
            }}
          >
            {/* Tyre */}
            <circle cx="35" cy="47" r="5.5" fill="#111827" stroke="#374151" strokeWidth="1" />
            {/* Hubcap & Rim Details */}
            <circle cx="35" cy="47" r="2.5" fill="#9CA3AF" />
            <circle cx="35" cy="47" r="0.8" fill="#4B5563" />
            <line x1="35" y1="44.5" x2="35" y2="49.5" stroke="#4B5563" strokeWidth="0.8" />
            <line x1="32.5" y1="47" x2="37.5" y2="47" stroke="#4B5563" strokeWidth="0.8" />
          </motion.g>
        </g>

        {/* Rear Wheel 2 */}
        <g>
          <motion.g
            style={{ transformOrigin: "45px 47px" }}
            variants={{
              hover: { rotate: 360, transition: { duration: 1.5, ease: "linear", repeat: Infinity } }
            }}
          >
            {/* Tyre */}
            <circle cx="45" cy="47" r="5.5" fill="#111827" stroke="#374151" strokeWidth="1" />
            {/* Hubcap & Rim Details */}
            <circle cx="45" cy="47" r="2.5" fill="#9CA3AF" />
            <circle cx="45" cy="47" r="0.8" fill="#4B5563" />
            <line x1="45" y1="44.5" x2="45" y2="49.5" stroke="#4B5563" strokeWidth="0.8" />
            <line x1="42.5" y1="47" x2="47.5" y2="47" stroke="#4B5563" strokeWidth="0.8" />
          </motion.g>
        </g>
      </motion.g>
    </motion.svg>
  );
}
