export function OceanArt() {
  return (
    <svg
      className="ocean-art"
      viewBox="0 0 470 300"
      role="img"
      aria-label="蓝洞深度示意插画，非真实游戏地图"
    >
      <defs>
        <linearGradient id="ocean" x2="0" y2="1">
          <stop stopColor="#1c8fa0" />
          <stop offset="1" stopColor="#10354f" />
        </linearGradient>
        <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#fff" opacity=".12" />
        </pattern>
      </defs>
      <rect width="470" height="300" rx="14" fill="url(#ocean)" />
      <rect width="470" height="300" fill="url(#dots)" />
      {[60, 145, 230].map((y, i) => (
        <g key={y}>
          <path
            d={`M28 ${y} H437`}
            stroke="white"
            strokeDasharray="4 7"
            opacity=".17"
          />
          <text
            x="388"
            y={y - 10}
            fill="#b9dde3"
            fontSize="11"
            fontFamily="monospace"
          >
            {["0–50 M", "50–130 M", "130 M+"][i]}
          </text>
        </g>
      ))}
      <path
        d="M0 35 Q38 10 65 42 L65 177 Q50 185 42 217 L0 217Z"
        fill="#123e55"
      />
      <path
        d="M470 15 L421 15 L416 53 L403 53 L403 95 L435 95 L435 137 L418 137 L418 253 L470 253Z"
        fill="#123e55"
      />
      <path
        d="M0 300 L0 266 Q54 248 91 274 Q149 245 202 275 Q239 245 294 272 Q357 258 397 274 L470 258 L470 300Z"
        fill="#0d2e44"
      />
      <g fill="none" stroke="#74cad0" strokeWidth="1" opacity=".4">
        <circle cx="235" cy="145" r="56" />
        <circle cx="235" cy="145" r="87" />
        <path d="M235 44V248M128 145H341" strokeDasharray="4 6" />
      </g>
      <g transform="translate(231 135) rotate(-18)">
        <ellipse cx="0" cy="0" rx="21" ry="14" fill="#f2ca65" />
        <circle cx="24" cy="-6" r="12" fill="#f8deb0" />
        <rect x="23" y="-12" width="12" height="10" rx="3" fill="#174858" />
        <rect x="-20" y="-16" width="28" height="10" rx="4" fill="#d9eff0" />
        <path
          d="M-15 8L-34 16L-46 9M-12 4L-34 -1L-47 -12"
          stroke="#f2ca65"
          strokeWidth="8"
          fill="none"
        />
        <path
          d="M12 7L29 13L40 8"
          stroke="#f8deb0"
          strokeWidth="5"
          fill="none"
        />
      </g>
      {[
        [110, 80, 1],
        [342, 111, 0.75],
        [155, 217, 0.8],
        [323, 224, 1.3],
      ].map(([x, y, s], i) => (
        <g
          key={i}
          transform={`translate(${x} ${y}) scale(${s})`}
          fill={i === 3 ? "#f2ca65" : "#76c9d2"}
          opacity=".85"
        >
          <path d="M-20 0 Q0 -17 24 0 Q0 16 -20 0 L-33 -10 L-33 10Z" />
          <circle cx="15" cy="-2" r="2" fill="#164653" />
        </g>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M${70 + i * 9} 281 q-12 -20 0 -36 q12 -15 0 -28`}
          fill="none"
          stroke="#4c9297"
          strokeWidth="5"
        />
      ))}
      <text x="28" y="28" fill="#d1edf0" fontSize="10" letterSpacing="2">
        BLUE HOLE / DEPTH STUDY
      </text>
      <text x="310" y="285" fill="#9fc6ce" fontSize="9">
        示意插画 · 非坐标地图
      </text>
    </svg>
  );
}
