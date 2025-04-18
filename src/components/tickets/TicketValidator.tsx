import React, { useState } from 'react';
import { verifyTicket } from '@/lib/services/ticket-service';
import { DigitalTicket } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QrCode, Search, User, Calendar, MapPin, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface TicketValidatorProps {
  onValidate?: (ticket: DigitalTicket) => void;
}

export const TicketValidator: React.FC<TicketValidatorProps> = ({ onValidate }) => {
  const [qrCodeData, setQrCodeData] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    ticketData?: DigitalTicket;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!qrCodeData.trim()) return;
    
    setLoading(true);
    try {
      const result = await verifyTicket(qrCodeData);
      setValidationResult(result);
      
      if (result.valid && result.ticketData && onValidate) {
        onValidate(result.ticketData);
      }
    } catch (error) {
      console.error('Error validating ticket:', error);
      setValidationResult({
        valid: false,
        message: 'An error occurred during validation'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setValidationResult(null);
    setQrCodeData('');
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="mr-2 h-5 w-5" />
            Ticket Validator
          </CardTitle>
          <CardDescription>
            Scan or enter ticket QR code data to validate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter QR code data"
                value={qrCodeData}
                onChange={(e) => setQrCodeData(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !qrCodeData}>
                <Search className="mr-2 h-4 w-4" />
                Validate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: In a production app, this would include a QR code scanner using the device camera.
            </p>
          </form>
        </CardContent>
      </Card>

      {validationResult && (
        <Card className={validationResult.valid ? 'border-green-500' : 'border-red-500'}>
          <CardHeader className={validationResult.valid ? 'bg-green-50' : 'bg-red-50'}>
            <CardTitle className="flex items-center">
              {validationResult.valid ? (
                <>
                  <Check className="mr-2 h-5 w-5 text-green-600" />
                  <span className="text-green-700">Valid Ticket</span>
                </>
              ) : (
                <>
                  <X className="mr-2 h-5 w-5 text-red-600" />
                  <span className="text-red-700">Invalid Ticket</span>
                </>
              )}
            </CardTitle>
            <CardDescription>
              {validationResult.message}
            </CardDescription>
          </CardHeader>
          
          {validationResult.valid && validationResult.ticketData && (
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <User className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Runner</h3>
                    <p className="text-sm text-gray-700">{validationResult.ticketData.runner_name}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Event Date</h3>
                    <p className="text-sm text-gray-700">{formatDate(validationResult.ticketData.event_date)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Event</h3>
                    <p className="text-sm text-gray-700">{validationResult.ticketData.event_name}</p>
                  </div>
                </div>
                
                {validationResult.ticketData.metadata.bib_number && (
                  <div className="flex items-start">
                    <QrCode className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Bib Number</h3>
                      <p className="text-sm text-gray-700">{validationResult.ticketData.metadata.bib_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
          
          <CardFooter>
            <Button onClick={handleReset} variant="outline">
              Check Another Ticket
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default TicketValidator; 