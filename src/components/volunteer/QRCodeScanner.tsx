"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, StopCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export default function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cleanup function to stop scanner when component unmounts
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(err => {
          console.error("Failed to stop scanner:", err);
        });
      }
    };
  }, [isScanning]);

  const startScanner = async () => {
    if (!containerRef.current) return;

    try {
      setMessage("Initializing camera...");
      setIsScanning(true);
      
      // Initialize the scanner
      scannerRef.current = new Html5Qrcode("qr-scanner-container");
      
      // Start scanning
      await scannerRef.current.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: 250,
          aspectRatio: 1,
        },
        (decodedText) => {
          // On successful scan
          handleScan(decodedText);
        },
        (errorMessage) => {
          // Ignore the QR code not found error
          if (errorMessage.includes("QR code not found")) {
            return;
          }
          
          // Handle other errors
          setMessage(`Scanning error: ${errorMessage}`);
          onError?.(errorMessage);
        }
      );
      
      setMessage("Camera is active. Point at a QR code to scan.");
    } catch (err: any) {
      setIsScanning(false);
      setMessage(`Failed to start scanner: ${err.message}`);
      onError?.(err.message);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setMessage("Scanner stopped.");
      } catch (err: any) {
        setMessage(`Failed to stop scanner: ${err.message}`);
      }
      setIsScanning(false);
    }
  };

  const handleScan = (data: string) => {
    // Stop scanning after a successful scan
    stopScanner();
    
    // Pass the data to the parent component
    onScan(data);
    
    // Set success message
    setMessage("QR code scanned successfully!");
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div 
            id="qr-scanner-container" 
            ref={containerRef} 
            className="w-full aspect-square rounded-md overflow-hidden bg-slate-100"
            style={{ display: isScanning ? "block" : "none" }}
          />
          
          {!isScanning && (
            <div className="w-full aspect-square rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
              <Camera className="h-12 w-12 text-slate-400" />
            </div>
          )}
          
          {message && (
            <p className="text-sm text-center my-2">
              {message}
            </p>
          )}
          
          <div className="flex justify-center">
            {!isScanning ? (
              <Button onClick={startScanner}>
                <Camera className="mr-2 h-4 w-4" />
                Start Scanner
              </Button>
            ) : (
              <Button variant="destructive" onClick={stopScanner}>
                <StopCircle className="mr-2 h-4 w-4" />
                Stop Scanner
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 