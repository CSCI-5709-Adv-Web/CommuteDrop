interface MapBackgroundProps {
  className?: string;
}

export default function MapBackground({ className = "" }: MapBackgroundProps) {
  return (
    <div className={`absolute inset-0 w-full h-full ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Base background */}
        <rect width="800" height="600" fill="#eef2ff" />

        {/* Grid lines */}
        <g opacity="0.3">
          <path d="M0 50H800" stroke="#6366f1" strokeWidth="1" />
          <path d="M0 100H800" stroke="#6366f1" strokeWidth="1" />
          <path d="M0 150H800" stroke="#6366f1" strokeWidth="1" />
          <path d="M0 200H800" stroke="#6366f1" strokeWidth="1" />
          <path d="M0 250H800" stroke="#6366f1" strokeWidth="1" />
          <path d="M0 300H800" stroke="#6366f1" strokeWidth="1" />
          <path d="M0 350H800" stroke="#6366f1" strokeWidth="1" />
          <path d="M0 400H800" stroke="#6366f1" strokeWidth="1" />
          <path d="M0 450H800" stroke="#6366f1" strokeWidth="1" />
          <path d="M0 500H800" stroke="#6366f1" strokeWidth="1" />
          <path d="M0 550H800" stroke="#6366f1" strokeWidth="1" />

          <path d="M50 0V600" stroke="#6366f1" strokeWidth="1" />
          <path d="M100 0V600" stroke="#6366f1" strokeWidth="1" />
          <path d="M150 0V600" stroke="#6366f1" strokeWidth="1" />
          <path d="M200 0V600" stroke="#6366f1" strokeWidth="1" />
          <path d="M250 0V600" stroke="#6366f1" strokeWidth="1" />
          <path d="M300 0V600" stroke="#6366f1" strokeWidth="1" />
          <path d="M350 0V600" stroke="#6366f1" strokeWidth="1" />
          <path d="M400 0V600" stroke="#6366f1" strokeWidth="1" />
          <path d="M450 0V600" stroke="#6366f1" strokeWidth="1" />
          <path d="M500 0V600" stroke="#6366f1" strokeWidth="1" />
          <path d="M550 0V600" stroke="#6366f1" strokeWidth="1" />
          <path d="M600 0V600" stroke="#6366f1" strokeWidth="1" />
          <path d="M650 0V600" stroke="#6366f1" strokeWidth="1" />
          <path d="M700 0V600" stroke="#6366f1" strokeWidth="1" />
          <path d="M750 0V600" stroke="#6366f1" strokeWidth="1" />
        </g>

        {/* Main roads */}
        <g opacity="0.7">
          <path d="M200 0V600" stroke="#4f46e5" strokeWidth="6" />
          <path d="M600 0V600" stroke="#4f46e5" strokeWidth="6" />
          <path d="M0 150H800" stroke="#4f46e5" strokeWidth="6" />
          <path d="M0 450H800" stroke="#4f46e5" strokeWidth="6" />
        </g>

        {/* Parks (green areas) */}
        <rect
          x="250"
          y="200"
          width="100"
          height="100"
          fill="#4ade80"
          opacity="0.6"
          rx="10"
        />
        <rect
          x="500"
          y="300"
          width="150"
          height="100"
          fill="#4ade80"
          opacity="0.6"
          rx="10"
        />

        {/* Water (blue area) */}
        <path
          d="M0 500C50 520 100 510 150 520C200 530 250 520 300 510C350 500 400 510 450 520C500 530 550 520 600 510C650 500 700 510 750 520C800 530 800 600 0 600Z"
          fill="#60a5fa"
          opacity="0.6"
        />

        {/* Curved roads */}
        <path
          d="M100 300C150 200 250 250 300 150"
          stroke="#4f46e5"
          strokeWidth="4"
          opacity="0.6"
        />
        <path
          d="M500 400C550 350 600 450 700 350"
          stroke="#4f46e5"
          strokeWidth="4"
          opacity="0.6"
        />

        {/* Buildings */}
        <rect
          x="220"
          y="170"
          width="20"
          height="20"
          fill="#94a3b8"
          opacity="0.8"
        />
        <rect
          x="260"
          y="180"
          width="25"
          height="15"
          fill="#94a3b8"
          opacity="0.8"
        />
        <rect
          x="620"
          y="170"
          width="30"
          height="20"
          fill="#94a3b8"
          opacity="0.8"
        />
        <rect
          x="670"
          y="180"
          width="20"
          height="25"
          fill="#94a3b8"
          opacity="0.8"
        />
        <rect
          x="220"
          y="470"
          width="25"
          height="20"
          fill="#94a3b8"
          opacity="0.8"
        />
        <rect
          x="260"
          y="460"
          width="15"
          height="25"
          fill="#94a3b8"
          opacity="0.8"
        />
        <rect
          x="620"
          y="470"
          width="20"
          height="20"
          fill="#94a3b8"
          opacity="0.8"
        />
        <rect
          x="670"
          y="460"
          width="25"
          height="15"
          fill="#94a3b8"
          opacity="0.8"
        />

        {/* Route markers */}
        <circle cx="250" cy="200" r="10" fill="#22c55e" />
        <circle cx="550" cy="400" r="10" fill="#ef4444" />

        {/* Route line */}
        <path
          d="M250 200C300 250 350 300 400 350C450 380 500 400 550 400"
          stroke="#2563eb"
          strokeWidth="5"
          strokeDasharray="10 10"
        />
      </svg>
    </div>
  );
}
