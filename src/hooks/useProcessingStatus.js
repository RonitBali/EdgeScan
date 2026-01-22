import { useState } from 'react';

export const useProcessingStatus = () => {
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const startProcessing = (msg = 'Processing...') => {
    setStatus('processing');
    setProgress(0);
    setMessage(msg);
  };

  const updateProgress = (value, msg) => {
    setProgress(value);
    if (msg) setMessage(msg);
  };

  const completeProcessing = (msg = 'Processing complete!') => {
    setStatus('success');
    setProgress(100);
    setMessage(msg);
  };

  const errorProcessing = (msg = 'An error occurred') => {
    setStatus('error');
    setMessage(msg);
  };

  const reset = () => {
    setStatus('idle');
    setProgress(0);
    setMessage('');
  };

  return {
    status,
    progress,
    message,
    startProcessing,
    updateProgress,
    completeProcessing,
    errorProcessing,
    reset,
    isProcessing: status === 'processing',
    isSuccess: status === 'success',
    isError: status === 'error',
    isIdle: status === 'idle'
  };
};
