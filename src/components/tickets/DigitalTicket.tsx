import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Download, Share2, User, Ticket as TicketIcon, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { DigitalTicket as DigitalTicketType } from './types';
import { generateQRCodeData } from '@/lib/services/ticket-service';

interface DigitalTicketProps {
  ticket: DigitalTicketType;
  onDownload?: () => void;
  onShare?: () => void;
  showVerificationStatus?: boolean;
}

export const DigitalTicket: React.FC<DigitalTicketProps> = ({
  ticket,
  onDownload,
  onShare,
  showVerificationStatus = false,
}) => {
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [verificationMessage, setVerificationMessage] = useState<string>('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Ensure QR code data is valid or regenerate it
  const qrCodeData = ticket.metadata?.qr_code_data || generateQRCodeData(
    ticket.user_id,
    ticket.event_id,
    ticket.ticket_id,
    ticket.id
  );

  // Handle download of QR code as image
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }

    // Default implementation if no custom handler provided
    const canvas = document.getElementById('qr-code-' + ticket.id) as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `ticket-${ticket.event_name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = url;
    link.click();
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <CardHeader className="bg-primary text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">{ticket.event_name}</CardTitle>
          <Badge className={`${getStatusColor(ticket.status)} ml-2`}>
            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
          </Badge>
        </div>
        <CardDescription className="text-primary-foreground">
          {ticket.ticket_name}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 flex flex-col items-center">
        <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4 relative">
          {/* QR Code with ticket information */}
          <QRCodeSVG
            id={`qr-code-${ticket.id}`}
            value={qrCodeData}
            size={200}
            level="H"
            includeMargin={true}
            className="mx-auto"
            imageSettings={{
              src: '/logo.png',
              x: undefined,
              y: undefined,
              height: 24,
              width: 24,
              excavate: true,
            }}
          />
          
          {/* Show verification status if enabled */}
          {showVerificationStatus && verificationStatus !== 'idle' && (
            <div className={`absolute inset-0 flex items-center justify-center rounded-lg ${
              verificationStatus === 'verified' 
                ? 'bg-green-100/80' 
                : verificationStatus === 'error'
                ? 'bg-red-100/80'
                : 'bg-white/80'
            }`}>
              {verificationStatus === 'verifying' && (
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              )}
              {verificationStatus === 'verified' && (
                <div className="text-center">
                  <Check className="w-16 h-16 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-800">{verificationMessage || 'Verified'}</p>
                </div>
              )}
              {verificationStatus === 'error' && (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-200 flex items-center justify-center mx-auto mb-2">
                    <span className="text-3xl text-red-600">✕</span>
                  </div>
                  <p className="font-medium text-red-800">{verificationMessage || 'Error'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full space-y-4 mt-2">
          <div className="flex items-start">
            <User className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Runner</h3>
              <p className="text-sm text-gray-700">{ticket.runner_name}</p>
            </div>
          </div>

          {ticket.metadata.bib_number && (
            <div className="flex items-start">
              <TicketIcon className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Bib Number</h3>
                <p className="text-sm text-gray-700">{ticket.metadata.bib_number}</p>
              </div>
            </div>
          )}

          <div className="flex items-start">
            <Calendar className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Event Date</h3>
              <p className="text-sm text-gray-700">{formatDate(ticket.event_date)}</p>
            </div>
          </div>

          {ticket.metadata.start_time && (
            <div className="flex items-start">
              <Clock className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Start Time</h3>
                <p className="text-sm text-gray-700">{ticket.metadata.start_time}</p>
              </div>
            </div>
          )}

          <div className="flex items-start">
            <MapPin className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Location</h3>
              <p className="text-sm text-gray-700">{ticket.event_location}</p>
            </div>
          </div>

          {ticket.metadata.race_distance && (
            <div className="flex items-start">
              <div className="h-5 w-5 mr-2 text-gray-500 mt-0.5 flex items-center justify-center">
                <span className="text-xs font-bold">KM</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Distance</h3>
                <p className="text-sm text-gray-700">{ticket.metadata.race_distance}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between bg-gray-50 py-3">
        <Button variant="outline" size="sm" onClick={handleDownload} className="flex items-center">
          <Download className="mr-1 h-4 w-4" />
          Download
        </Button>
        <Button variant="outline" size="sm" onClick={onShare} className="flex items-center">
          <Share2 className="mr-1 h-4 w-4" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DigitalTicket; 