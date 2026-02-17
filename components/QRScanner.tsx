"use client";

import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X } from "lucide-react";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const hasScanned = useRef(false);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        if (hasScanned.current) return;
        hasScanned.current = true;
        onScan(decodedText);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(() => {});
        }
      },
      () => {
        // Errors are common during scanning (no QR in frame), ignore them
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((err: unknown) =>
            console.error("Failed to clear scanner", err)
          );
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X size={28} />
      </button>

      <div className="w-full max-w-lg overflow-hidden rounded-2xl liquid-glass">
        <div id="qr-reader" className="w-full"></div>
      </div>

      <p className="mt-8 text-center text-gray-400 animate-pulse font-medium">
        Inquadra il QR Code JumpIn per effettuare il Check-in
      </p>
    </div>
  );
};

export default QRScanner;
