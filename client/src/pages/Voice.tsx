import React, { useEffect } from 'react';
import VoiceChatWidget from '../components/VoiceChatWidget';
import SEO from '../components/SEO';
import { trackPageview } from '../utils/analytics';

const VoicePage: React.FC = () => {
  // Track pageview for authenticated users (Voice page requires auth)
  useEffect(() => {
    trackPageview('/voice', 'Voice GMAT Assistant - GMAT.site');
  }, []);

  return (
    <div style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center' }}>
      <SEO title="Voice GMAT Assistant" description="Talk to the GMAT practice assistant in real time using streaming AI voice." />
      <VoiceChatWidget />
    </div>
  );
};

export default VoicePage;
