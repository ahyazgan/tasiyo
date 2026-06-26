import { motion } from "framer-motion";

export default function SilobasIcon({ size = 48, className = "" }) {
  // Blue theme gradient details
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
        {/* Sleek metallic blue gradient for the silo tank */}
        <linearGradient id="siloGrad" x1="20" y1="18" x2="52" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="60%" stopColor="#2E6FA3" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        {/* Cab color gradient */}
        <linearGradient id="siloCabGrad" x1="4" y1="24" x2="20" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4B5563" />
          <stop offset="100%" stopColor="#1F2937" />
        </linearGradient>
        {/* Glow filter for pressure/flow piping */}
        <filter id="blueGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ground Shadow */}
      <ellipse cx="32" cy="53" rx="22" ry="2.5" fill="#000" opacity="0.12" />

      {/* Main Truck Frame Group (suspension bounce) */}
      <motion.g
        variants={{
          hover: { y: [0, -0.8, 0.4, 0], transition: { duration: 0.4 } }
        }}
      >
        {/* Cab Chassis */}
        <rect x="12" y="43" width="10" height="4" rx="1" fill="#374151" />
        {/* Trailer Main Frame Chassis */}
        <rect x="20" y="42" width="31" height="3" rx="1" fill="#4B5563" />
        <line x1="20" y1="41" x2="24" y2="34" stroke="#4B5563" strokeWidth="2.5" />

        {/* Cabin Assembly (Facing Left) */}
        <g>
          {/* Cab Main Body */}
          <path d="M6 44V26C6 24.8954 6.89543 24 8 24H20C21.1046 24 22 24.8954 22 26V44H6Z" fill="url(#siloCabGrad)" />
          
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
            fill="#3B82F6"
            variants={{
              hover: {
                scale: 1.3,
                fill: "#93C5FD",
                filter: "url(#blueGlow)",
                transition: { duration: 0.2 }
              }
            }}
          />
          
          {/* Side Mirror */}
          <rect x="18" y="27" width="1.5" height="5" rx="0.5" fill="#1F2937" />
          <line x1="16.5" y1="29.5" x2="18" y2="29.5" stroke="#1F2937" strokeWidth="1" />
        </g>

        {/* The Silobas Tank (Pressurized Powder Trailer) */}
        <g>
          {/* Tank body outline: has hoppers at x=28 and x=40 */}
          <path
            d="M22 23C22 19 25 18 28 18H48C51 18 52 19 52 23V31H50L45 39C44.5 40 43.5 40 43 39L39 33H33L29 39C28.5 40 27.5 40 27 39L23 31H22V23Z"
            fill="url(#siloGrad)"
            stroke="#2E6FA3"
            strokeWidth="1"
          />

          {/* Top Loading Manhole Hatches */}
          <rect x="29" y="15" width="5" height="3" rx="0.8" fill="#1E40AF" stroke="#60A5FA" strokeWidth="0.8" />
          <rect x="41" y="15" width="5" height="3" rx="0.8" fill="#1E40AF" stroke="#60A5FA" strokeWidth="0.8" />

          {/* Rear Service Ladder */}
          <line x1="51" y1="18" x2="51" y2="33" stroke="#D1D5DB" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="50" y1="21" x2="52" y2="21" stroke="#D1D5DB" strokeWidth="1" />
          <line x1="50" y1="24" x2="52" y2="24" stroke="#D1D5DB" strokeWidth="1" />
          <line x1="50" y1="27" x2="52" y2="27" stroke="#D1D5DB" strokeWidth="1" />
          <line x1="50" y1="30" x2="52" y2="30" stroke="#D1D5DB" strokeWidth="1" />

          {/* Hopper outlet cones at the bottom (powder discharge hoppers) */}
          {/* Hopper 1 */}
          <path d="M26.5 38.5L28 41H32L33.5 38.5Z" fill="#1E3A8A" />
          {/* Hopper 2 */}
          <path d="M42.5 38.5L44 41H48L49.5 38.5Z" fill="#1E3A8A" />

          {/* Metallic pipe fittings */}
          <circle cx="30" cy="41" r="1.2" fill="#9CA3AF" />
          <circle cx="46" cy="41" r="1.2" fill="#9CA3AF" />
        </g>

        {/* Industrial Discharge Piping (Runs from bottom cones to the rear) */}
        {/* Main dark metal pipe base */}
        <path d="M 28 41.5 H 46 H 51.5 C 52.5 41.5 53 42 53 43 V 45" stroke="#4B5563" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <rect x="51.5" y="44.5" width="3" height="1.5" rx="0.5" fill="#374151" />

        {/* Animated active flow line (glows and pulses on hover) */}
        <motion.path
          d="M 28 41.5 H 46 H 51.5 C 52.5 41.5 53 42 53 43 V 45"
          stroke="#93C5FD"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="4 4"
          initial={{ opacity: 0.1, strokeDashoffset: 0 }}
          variants={{
            hover: {
              opacity: 1,
              strokeDashoffset: -20,
              filter: "url(#blueGlow)",
              transition: {
                strokeDashoffset: { repeat: Infinity, ease: "linear", duration: 0.8 },
                opacity: { duration: 0.2 }
              }
            }
          }}
        />

        {/* Pressurized Powder/Vapor Puffs discharging from outlet (Animate on hover) */}
        {/* Puff 1 */}
        <motion.circle
          cx="53"
          cy="47"
          r="1.5"
          fill="#DBEAFE"
          initial={{ opacity: 0, x: 0, y: 0 }}
          variants={{
            hover: {
              opacity: [0, 0.8, 0.6, 0],
              x: [-1, 2, 5, 8],
              y: [0, 4, 9, 14],
              scale: [0.6, 1.4, 2.0, 2.5],
              transition: { duration: 0.9, ease: "easeOut", repeat: Infinity, repeatDelay: 0.1 }
            }
          }}
        />
        {/* Puff 2 */}
        <motion.circle
          cx="53"
          cy="47"
          r="1.2"
          fill="#EFF6FF"
          initial={{ opacity: 0, x: 0, y: 0 }}
          variants={{
            hover: {
              opacity: [0, 0, 0.9, 0.5, 0],
              x: [0, 3, 6],
              y: [0, 5, 11],
              scale: [0.5, 1.2, 1.8, 1.2],
              transition: { duration: 0.8, ease: "easeOut", delay: 0.3, repeat: Infinity, repeatDelay: 0.2 }
            }
          }}
        />
        {/* Puff 3 (smaller particulate) */}
        <motion.circle
          cx="53"
          cy="47"
          r="1.0"
          fill="#93C5FD"
          initial={{ opacity: 0, x: 0, y: 0 }}
          variants={{
            hover: {
              opacity: [0, 0.7, 0.4, 0],
              x: [0, 4, 7],
              y: [0, 3, 7],
              scale: [0.6, 1.0, 1.4],
              transition: { duration: 0.6, ease: "easeOut", delay: 0.15, repeat: Infinity, repeatDelay: 0.3 }
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

        {/* Trailer Axle Wheel 1 */}
        <g>
          <motion.g
            style={{ transformOrigin: "36px 47px" }}
            variants={{
              hover: { rotate: 360, transition: { duration: 1.5, ease: "linear", repeat: Infinity } }
            }}
          >
            {/* Tyre */}
            <circle cx="36" cy="47" r="5.5" fill="#111827" stroke="#374151" strokeWidth="1" />
            {/* Hubcap & Rim Details */}
            <circle cx="36" cy="47" r="2.5" fill="#9CA3AF" />
            <circle cx="36" cy="47" r="0.8" fill="#4B5563" />
            <line x1="36" y1="44.5" x2="36" y2="49.5" stroke="#4B5563" strokeWidth="0.8" />
            <line x1="32.5" y1="47" x2="37.5" y2="47" stroke="#4B5563" strokeWidth="0.8" />
          </motion.g>
        </g>

        {/* Trailer Axle Wheel 2 */}
        <g>
          <motion.g
            style={{ transformOrigin: "44px 47px" }}
            variants={{
              hover: { rotate: 360, transition: { duration: 1.5, ease: "linear", repeat: Infinity } }
            }}
          >
            {/* Tyre */}
            <circle cx="44" cy="47" r="5.5" fill="#111827" stroke="#374151" strokeWidth="1" />
            {/* Hubcap & Rim Details */}
            <circle cx="44" cy="47" r="2.5" fill="#9CA3AF" />
            <circle cx="44" cy="47" r="0.8" fill="#4B5563" />
            <line x1="44" y1="44.5" x2="44" y2="49.5" stroke="#4B5563" strokeWidth="0.8" />
            <line x1="41.5" y1="47" x2="46.5" y2="47" stroke="#4B5563" strokeWidth="0.8" />
          </motion.g>
        </g>
      </motion.g>
    </motion.svg>
  );
}
