"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguagePopupProps {
  onContinue: (selectedLanguage: string) => void;
}

const PopUp: React.FC<LanguagePopupProps> = ({ onContinue }) => {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    if (selectedLanguage && agreed) {
      onContinue(selectedLanguage);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Select Your Language
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {/* Modern dropdown using Shadcn's Select */}
          <Select onValueChange={(value) => setSelectedLanguage(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              {/* Add more options as needed */}
            </SelectContent>
          </Select>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 hover:text-blue-800"
              >
                Terms and Conditions
              </a>
            </span>
          </div>
          <Button
            onClick={handleContinue}
            disabled={!selectedLanguage || !agreed}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PopUp;
