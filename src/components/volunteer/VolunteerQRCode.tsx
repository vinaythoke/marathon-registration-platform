"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, User } from "lucide-react";
import QRCode from "qrcode";

interface VolunteerQRCodeProps {
  volunteerId: string;
  volunteerName: string;
  eventId: string;
  roleId?: string;
  roleName?: string;
}

export default function VolunteerQRCode({
  volunteerId,
  volunteerName,
  eventId,
  roleId,
  roleName,
}: VolunteerQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate the QR code data
  const qrData = JSON.stringify({
    type: "volunteer_check_in",
    volunteerId,
    eventId,
    roleId,
    timestamp: new Date().toISOString(),
  });

  // Generate the QR code on component mount
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        qrData,
        {
          width: 256,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) {
            console.error("Error generating QR code:", error);
          }
        }
      );
    }
  }, [qrData]);

  // Function to download the QR code as an image
  const downloadQRCode = () => {
    if (!canvasRef.current) return;

    const link = document.createElement("a");
    link.download = `volunteer-qr-${volunteerId}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Volunteer Check-In</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="bg-white p-4 rounded-lg">
          <canvas ref={canvasRef} />
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{volunteerName}</span>
          </div>
          {roleName && (
            <p className="text-sm text-muted-foreground">Role: {roleName}</p>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={downloadQRCode}
        >
          <Download className="mr-2 h-4 w-4" />
          Download QR Code
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Show this QR code to event staff for check-in.
          <br />
          This QR code is unique to you and should not be shared.
        </p>
      </CardContent>
    </Card>
  );
} 