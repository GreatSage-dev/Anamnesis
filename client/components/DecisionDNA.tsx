import React, { useEffect, useState, useRef } from 'react';

/**
 * Decision DNA — Animated behavioral fingerprint.
 * Re-triggers scramble & bar load-up animations EVERY TIME scrolled into view.
 */

interface DecisionDNAProps {
  address: string;
  walletAgeScore: number;
  txFrequencyScore: number;
  paymentConsistencyScore: number;
  riskScore: number;
  totalDecisions: number;
  approvals: number;
  cautions: number;
  denials: number;
}

const HEX_CHARS = '0123456789abcdef';

function useScrambleText(target: string, trigger: boolean, duration = 1200) {
  const [display, setDisplay] = useState('0x0000...0000');
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!target || !trigger) {
      setDisplay('0x0000...0000');
      return;
    }
    const startTime = Date.now();
    const chars = target.split('');

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const result = chars.map((char, i) => {
        const charProgress = Math.min((progress * chars.length - i + 4) / 4, 1);
        if (charProgress >= 1) return char;
        if (char === '.' || char === 'x' || char === ' ') return char;
        return HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
      });

      setDisplay(result.join(''));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, trigger, duration]);

  return display;
}

function DNABar({
  label,
  value,
  isRisk,
  delay,
  trigger,
}: {
  label: string;
  value: number;
  isRisk?: boolean;
  delay: number;
  trigger: boolean;
}) {
  const [width, setWidth] = useState(0);
  const [displayVal, setDisplayVal] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!trigger) {
      setWidth(0);
      setDisplayVal(0);
      return;
    }

    const startTime = Date.now();
    const duration = 1000;

    const timer = setTimeout(() => {
      function tick() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setWidth(eased * value);
        setDisplayVal(Math.round(eased * value));
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(tick);
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frameRef.current);
    };
  }, [value, delay, trigger]);

  const riskClass = isRisk ? (value > 60 ? 'risk high' : value > 30 ? 'risk' : '') : '';

  return (
    <div className="dna-bar-row">
      <span className="dna-bar-label">{label}</span>
      <div className="dna-bar-track">
        <div
          className={`dna-bar-fill ${riskClass}`}
          style={{ width: `${Math.min(100, Math.max(0, width))}%` }}
        />
      </div>
      <span className="dna-bar-value">{displayVal}</span>
    </div>
  );
}

export default function DecisionDNA({
  address,
  walletAgeScore,
  txFrequencyScore,
  paymentConsistencyScore,
  riskScore,
  totalDecisions,
  approvals,
  cautions,
  denials,
}: DecisionDNAProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        } else {
          setIsInView(false);
        }
      },
      { threshold: 0.2 } // Trigger when 20% of card enters/leaves viewport
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '—';

  const scrambled = useScrambleText(shortAddr, isInView, 1400);

  // Stagger the memory row fade-in
  const [showMemory, setShowMemory] = useState(false);
  useEffect(() => {
    if (!isInView) {
      setShowMemory(false);
      return;
    }
    const t = setTimeout(() => setShowMemory(true), 1800);
    return () => clearTimeout(t);
  }, [isInView]);

  return (
    <div className="dna-container" ref={containerRef}>
      <div className="dna-address">
        <span style={{ marginRight: 8, opacity: 0.5 }}>COUNTERPARTY</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{scrambled}</span>
      </div>

      <DNABar label="Wallet Age" value={walletAgeScore} delay={300} trigger={isInView} />
      <DNABar label="Tx Frequency" value={txFrequencyScore} delay={500} trigger={isInView} />
      <DNABar label="Payment Consistency" value={paymentConsistencyScore} delay={700} trigger={isInView} />
      <DNABar label="Risk Score" value={riskScore} isRisk delay={900} trigger={isInView} />

      <div
        className="dna-memory-row"
        style={{
          opacity: showMemory ? 1 : 0,
          transform: showMemory ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <span>MEMORY</span>
        <span className="dna-memory-dot" />
        <span className="dna-memory-count">{totalDecisions} decisions</span>
        <span className="dna-memory-dot" />
        <span>{approvals} approved</span>
        <span className="dna-memory-dot" />
        <span>{cautions} caution</span>
        <span className="dna-memory-dot" />
        <span>{denials} deny</span>
      </div>
    </div>
  );
}
