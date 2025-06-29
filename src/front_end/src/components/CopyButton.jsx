import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const CopyButton = ({ text, className = '' }) => {
  const [copied, setCopied] = useState(false);

  return (
    <CopyToClipboard
      text={text}
      onCopy={() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      <button className={`flex items-center gap-1 text-xs text-gray-300 hover:text-white ${className}`}>
        {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </CopyToClipboard>
  );
};

export default CopyButton;
