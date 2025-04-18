import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarSearch } from 'lucide-react';
import Link from 'next/link';

interface NoEventsPlaceholderProps {
  title: string;
  description: string;
  actionHref: string;
  actionText: string;
}

export default function NoEventsPlaceholder({
  title,
  description,
  actionHref,
  actionText
}: NoEventsPlaceholderProps) {
  return (
    <Card className="w-full border-dashed">
      <CardHeader className="flex justify-center items-center">
        <CalendarSearch className="h-12 w-12 text-muted-foreground/50 mb-2" />
        <CardTitle className="text-center">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-6">
        <Link href={actionHref}>
          <Button>{actionText}</Button>
        </Link>
      </CardContent>
    </Card>
  );
} 