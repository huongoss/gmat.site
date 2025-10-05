import React from 'react';
import VoiceChatWidget from '../components/VoiceChatWidget';
import SEO from '../components/SEO';

const VoicePage: React.FC = () => {
  return (
    <div style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center' }}>
      <SEO title="Voice GMAT Assistant" description="Talk to the GMAT practice assistant in real time using streaming AI voice." />
      <VoiceChatWidget />
    </div>
  );
};

export default VoicePage;
