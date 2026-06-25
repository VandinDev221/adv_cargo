import { useRef, useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

export function isGoogleLoginEnabled() {
  return Boolean(clientId);
}

export default function GoogleLoginButton({ onSuccess, onError, disabled, text = 'signin_with' }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setWidth(Math.max(Math.floor(el.offsetWidth), 200));
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!clientId) return null;

  return (
    <div
      ref={containerRef}
      className={`w-full flex justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        useOneTap={false}
        theme="outline"
        size="large"
        text={text}
        shape="rectangular"
        width={width}
        locale="pt-BR"
      />
    </div>
  );
}
